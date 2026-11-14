require "net/http"
require "openssl"
require "timeout"

# Performs a single HTTP probe for a Monitor.
#
# Contract (mirrors PulseDock semantics):
#   * bounded timeouts — the check can never hang longer than
#     monitor.timeout_seconds per phase;
#   * a timeout or transport error is recorded as :down, never as a
#     healthy observation;
#   * a response whose status differs from monitor.expected_status is :down;
#   * an expected response slower than monitor.warn_latency_ms is :degraded;
#   * error strings are generic labels — raw exception messages may embed
#     the probed URL (which can carry tokens) and are never surfaced.
class HttpCheckService
  MAX_REDIRECTS = 3
  REDIRECT_CODES = %w[301 302 303 307 308].freeze
  USER_AGENT = "BeaconDock/1.0 (+uptime monitor)".freeze

  Result = Data.define(:status, :http_status, :latency_ms, :error) do
    def down? = status == :down
  end

  def initialize(monitor)
    @monitor = monitor
  end

  def call
    response = nil
    latency_ms = measure do
      response = fetch(uri_for(monitor.url), redirects_left: MAX_REDIRECTS)
    end

    build_result(response, latency_ms)
  rescue StandardError => e
    Result.new(status: :down, http_status: nil, latency_ms: nil, error: error_label(e))
  end

  private
    attr_reader :monitor

    def uri_for(url)
      URI.parse(url)
    end

    def measure
      started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      yield
      ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started) * 1000).round(1)
    end

    def fetch(uri, redirects_left:)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.is_a?(URI::HTTPS)
      http.verify_mode = OpenSSL::SSL::VERIFY_PEER
      http.open_timeout = monitor.timeout_seconds
      http.read_timeout = monitor.timeout_seconds
      http.write_timeout = monitor.timeout_seconds

      response = http.start { |conn| conn.request(build_request(uri)) }

      if response.code.to_s.in?(REDIRECT_CODES) && response["location"].present?
        raise TooManyRedirectsError if redirects_left.zero?

        fetch(uri_for(URI.join(uri.to_s, response["location"]).to_s), redirects_left: redirects_left - 1)
      else
        response
      end
    end

    def build_request(uri)
      klass = monitor.http_method == "HEAD" ? Net::HTTP::Head : Net::HTTP::Get
      klass.new(uri.request_uri.presence || "/").tap do |request|
        request["user-agent"] = USER_AGENT
        request["accept"] = "*/*"
      end
    end

    def build_result(response, latency_ms)
      actual = response.code.to_i

      if actual != monitor.expected_status
        Result.new(status: :down, http_status: actual, latency_ms: latency_ms,
          error: "Expected HTTP #{monitor.expected_status}, got #{actual}")
      elsif latency_ms > monitor.warn_latency_ms
        Result.new(status: :degraded, http_status: actual, latency_ms: latency_ms, error: nil)
      else
        Result.new(status: :up, http_status: actual, latency_ms: latency_ms, error: nil)
      end
    end

    # Generic labels only: exception messages can contain the full URL,
    # and monitor URLs may carry secret tokens.
    def error_label(error)
      case error
      when Net::OpenTimeout, Net::ReadTimeout, Net::WriteTimeout, Timeout::Error
        "Request timed out"
      when SocketError
        "DNS lookup failed"
      when OpenSSL::SSL::SSLError
        "TLS handshake failed"
      when TooManyRedirectsError
        "Too many redirects"
      when URI::InvalidURIError
        "Invalid URL"
      when SystemCallError, SocketError
        "Connection failed"
      else
        "Check failed"
      end
    end

    class TooManyRedirectsError < StandardError; end
end
