# Domain model for an HTTP endpoint to check.
#
# Named `SiteMonitor` rather than `Monitor` on purpose: ActiveSupport
# requires Ruby's stdlib `monitor`, which owns the top-level ::Monitor
# constant — connection pools, ActionCable, MemoryStore and Zeitwerk itself
# all call `Monitor.new` by name at runtime, so an AR class can never own it.
#
# model_name is pinned to "Monitor" so every public contract stays unchanged:
# table `monitors`, params `monitor[...]`, route helpers `monitor_path`,
# dom ids `monitor_42`, partial `monitors/_monitor`, i18n key `monitor`.
class SiteMonitor < ApplicationRecord
  def self.model_name
    @model_name ||= ActiveModel::Name.new(self, nil, "Monitor")
  end

  # Check pipeline statuses. `pending` means "never checked" and must never be
  # treated as a healthy observation.
  enum :last_status, { pending: 0, up: 1, down: 2, degraded: 3 }, default: :pending, prefix: true

  HTTP_METHODS = %w[GET HEAD].freeze
  INTERVAL_SECONDS = [ 30, 60, 120, 300, 600, 900, 1800, 3600 ].freeze

  belongs_to :user
  has_many :checks, -> { order(checked_at: :desc) }, dependent: :delete_all,
    foreign_key: :monitor_id, inverse_of: :monitor
  has_many :incidents, -> { order(started_at: :desc) }, dependent: :destroy,
    foreign_key: :monitor_id, inverse_of: :monitor

  validates :name, presence: true, length: { maximum: 80 }
  validates :url, presence: true, length: { maximum: 2000 }
  validates :http_method, inclusion: { in: HTTP_METHODS }
  validates :interval_seconds, inclusion: { in: INTERVAL_SECONDS }
  validates :timeout_seconds, numericality: { only_integer: true, in: 1..30 }
  validates :expected_status, numericality: { only_integer: true, in: 100..599 }
  validates :warn_latency_ms, numericality: { only_integer: true, in: 100..60_000 }
  validates :consecutive_failures, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :url_must_be_http_or_https

  before_validation :schedule_first_check, on: :create
  before_save :reschedule_when_timing_changes

  scope :active, -> { where(active: true) }
  scope :due_for_check, -> { where(next_check_at: ..Time.current).or(where(next_check_at: nil)) }

  # Host portion of the URL only — full URLs may embed credentials or tokens
  # in query params, so views/APIs display this instead.
  def host
    @host ||= URI.parse(url).host.presence || url
  rescue URI::InvalidURIError
    url
  end

  def operational?
    last_status_up? || last_status_degraded?
  end

  # Fraction of checks in the window that answered successfully
  # (`up` or `degraded` — degraded still responds). Nil when no data exists.
  def uptime_percentage(period = 24.hours)
    stats = checks.where(checked_at: period.ago..).group(:status).count
    total = stats.values.sum
    return nil if total.zero?

    available = stats.fetch("up", 0) + stats.fetch("degraded", 0)
    (available * 100.0 / total).round(2)
  end

  def recent_latencies(limit = 30)
    checks.where.not(latency_ms: nil).limit(limit).pluck(:latency_ms).reverse
  end

  private
    def url_must_be_http_or_https
      uri = URI.parse(url.to_s)
      unless uri.is_a?(URI::HTTP) && uri.host.present?
        errors.add(:url, :invalid_url)
      end
    rescue URI::InvalidURIError
      errors.add(:url, :invalid_url)
    end

    def schedule_first_check
      self.next_check_at ||= Time.current if active?
    end

    # Edits to cadence/active flag re-arm the scheduler so a paused or
    # reconfigured monitor is picked up promptly.
    def reschedule_when_timing_changes
      if (will_save_change_to_active? && active?) || will_save_change_to_interval_seconds?
        self.next_check_at = Time.current
      end
    end
end
