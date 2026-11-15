class Incident < ApplicationRecord
  belongs_to :monitor, class_name: "SiteMonitor", inverse_of: :incidents

  validates :started_at, presence: true

  scope :ongoing, -> { where(resolved_at: nil) }
  scope :resolved, -> { where.not(resolved_at: nil) }

  def ongoing?
    resolved_at.nil?
  end

  def duration
    ((resolved_at || Time.current) - started_at).seconds
  end
end
