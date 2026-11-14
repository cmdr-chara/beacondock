class Check < ApplicationRecord
  # A check is a single observation. There is deliberately no "pending" here:
  # failed/cancelled work is never recorded as a healthy result.
  enum :status, { up: 0, down: 1, degraded: 2 }

  RETENTION_PERIOD = 30.days

  belongs_to :monitor, class_name: "SiteMonitor", inverse_of: :checks

  validates :status, presence: true
  validates :checked_at, presence: true
  validates :http_status, numericality: { only_integer: true, in: 100..599 }, allow_nil: true
  validates :latency_ms, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  scope :recent, -> { order(checked_at: :desc) }
  scope :older_than_retention, -> { where(checked_at: ...RETENTION_PERIOD.ago) }
  scope :within, ->(period) { where(checked_at: period.ago..) }
end
