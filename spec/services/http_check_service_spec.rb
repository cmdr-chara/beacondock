require "rails_helper"

RSpec.describe HttpCheckService, type: :service do
  let(:monitor) { build(:monitor, url: url) }
  let(:url) { "https://example.com/health" }
  subject(:result) { described_class.new(monitor).call }

  it "returns up on the expected status" do
    stub_request(:get, url).to_return(status: 200, body: "ok")

    expect(result.status).to eq(:up)
    expect(result.http_status).to eq(200)
    expect(result.latency_ms).to be >= 0
    expect(result.error).to be_nil
  end

  it "returns down on an unexpected HTTP status" do
    stub_request(:get, url).to_return(status: 500)

    expect(result.status).to eq(:down)
    expect(result.http_status).to eq(500)
    expect(result.error).to include("500")
  end

  it "honours a custom expected_status" do
    monitor.expected_status = 204
    stub_request(:get, url).to_return(status: 204)
    expect(described_class.new(monitor).call.status).to eq(:up)
  end

  it "returns degraded when latency exceeds warn threshold" do
    monitor.warn_latency_ms = 0
    stub_request(:get, url).to_return(status: 200)

    expect(result.status).to eq(:degraded)
    expect(result.http_status).to eq(200)
  end

  it "follows up to MAX_REDIRECTS redirects" do
    stub_request(:get, url).to_return(status: 302, headers: { "Location" => "https://example.com/v2" })
    stub_request(:get, "https://example.com/v2").to_return(status: 200)

    expect(result.status).to eq(:up)
    expect(result.http_status).to eq(200)
  end

  it "is down when redirects exceed the limit" do
    urls = [ url ] + (1..5).map { |i| "https://example.com/r#{i}" }
    urls.each_cons(2) do |from, to|
      stub_request(:get, from).to_return(status: 302, headers: { "Location" => to })
    end
    stub_request(:get, urls.last).to_return(status: 302, headers: { "Location" => "https://example.com/never" })

    expect(result.status).to eq(:down)
    expect(result.error).to eq("Too many redirects")
  end

  it "maps timeouts to down without raising" do
    stub_request(:get, url).to_timeout

    expect(result.status).to eq(:down)
    expect(result.error).to eq("Request timed out")
    expect(result.http_status).to be_nil
  end

  it "maps TLS errors to down with a generic label" do
    stub_request(:get, url).to_raise(OpenSSL::SSL::SSLError.new("certificate verify failed: secret path /health?token=abc"))

    expect(result.status).to eq(:down)
    expect(result.error).to eq("TLS handshake failed")
    expect(result.error).not_to include("token")
  end

  it "maps DNS failures to down" do
    stub_request(:get, url).to_raise(SocketError.new("getaddrinfo"))

    expect(result.status).to eq(:down)
    expect(result.error).to eq("DNS lookup failed")
  end

  it "maps connection failures to down" do
    stub_request(:get, url).to_raise(Errno::ECONNREFUSED)

    expect(result.status).to eq(:down)
    expect(result.error).to eq("Connection failed")
  end

  it "performs HEAD checks" do
    monitor.http_method = "HEAD"
    stub_request(:head, url).to_return(status: 200)

    expect(described_class.new(monitor).call.status).to eq(:up)
    expect(a_request(:head, url)).to have_been_made
  end

  it "returns down for an invalid URL" do
    monitor.url = "::::::"
    expect(result.status).to eq(:down)
    expect(result.error).to eq("Invalid URL")
  end
end
