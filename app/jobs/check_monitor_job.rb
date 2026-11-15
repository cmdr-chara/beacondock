# Runs one monitor through the check pipeline. Enqueued by ScheduleChecksJob
# (and can be enqueued ad-hoc for a manual "check now").
#
# A job-level failure never produces a healthy observation: only
# MonitorStatusService writes Check rows, and HttpCheckService turns any
# transport failure into an explicit :down result first.
class CheckMonitorJob < ApplicationJob
  queue_as :default

  discard_on ActiveRecord::RecordNotFound

  def perform(monitor_id)
    monitor = SiteMonitor.find(monitor_id)
    return unless monitor.active?

    result = HttpCheckService.new(monitor).call
    MonitorStatusService.new(monitor).record!(result)
  end
end
