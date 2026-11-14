# Dispatcher for the check pipeline. Runs on a recurring schedule (see
# config/recurring.yml) and enqueues one CheckMonitorJob per due monitor.
#
# To keep overlapping sweeps from double-enqueueing the same monitor, each
# monitor's next_check_at is pushed forward *before* its job is enqueued
# (grouped by interval so this stays a handful of UPDATEs, not N).
class ScheduleChecksJob < ApplicationJob
  queue_as :default

  def perform
    due_by_interval.each do |interval_seconds, monitor_ids|
      SiteMonitor.where(id: monitor_ids).update_all(next_check_at: interval_seconds.seconds.from_now) # rubocop:disable Rails/SkipsModelValidations
      monitor_ids.each { |id| CheckMonitorJob.perform_later(id) }
    end
  end

  private
    # => { 300 => [1, 2], 60 => [3] }
    def due_by_interval
      SiteMonitor.active.due_for_check
        .pluck(:id, :interval_seconds)
        .group_by(&:last)
        .transform_values { |pairs| pairs.map(&:first) }
    end
end
