# Records a check result onto a Monitor: persists the Check row, updates the
# monitor's roll-up state, opens/resolves incidents (with flap protection).
#
# Incidents open only after FAILURE_THRESHOLD consecutive :down results so a
# single transient failure does not page anyone. A :degraded result is a
# successful observation — it resets the failure counter.
class MonitorStatusService
  FAILURE_THRESHOLD = 2

  def initialize(monitor)
    @monitor = monitor
  end

  def record!(result)
    now = Time.current

    check = nil
    SiteMonitor.transaction do
      check = monitor.checks.create!(
        status: result.status,
        http_status: result.http_status,
        latency_ms: result.latency_ms,
        error: result.error,
        checked_at: now
      )

      monitor.update!(
        last_status: result.status,
        last_checked_at: now,
        consecutive_failures: result.down? ? monitor.consecutive_failures + 1 : 0,
        next_check_at: now + monitor.interval_seconds.seconds
      )

      update_incidents(result, now)
    end

    check
  end

  private
    attr_reader :monitor

    def update_incidents(result, now)
      if result.down? && monitor.consecutive_failures >= FAILURE_THRESHOLD && open_incident.nil?
        monitor.incidents.create!(started_at: now, cause: result.error.presence || "Monitor is down")
      elsif !result.down? && open_incident.present?
        open_incident.update!(resolved_at: now)
      end
    end

    def open_incident
      @open_incident ||= monitor.incidents.ongoing.first
    end
end
