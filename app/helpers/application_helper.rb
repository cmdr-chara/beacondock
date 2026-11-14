module ApplicationHelper
  STATUS_BADGE_CLASSES = {
    "up" => "badge-up",
    "down" => "badge-down",
    "degraded" => "badge-degraded",
    "pending" => "badge-pending"
  }.freeze

  def status_badge(status)
    css = STATUS_BADGE_CLASSES.fetch(status.to_s, "badge-pending")
    tag.span(t("statuses.#{status}"), class: "badge #{css}")
  end

  def format_uptime(monitor, period)
    value = monitor.uptime_percentage(period)
    value.nil? ? t("common.not_available") : "#{value}%"
  end

  def format_latency(ms)
    ms.nil? ? t("common.not_available") : t("common.latency_ms", value: ms.round)
  end

  def format_check_time(time)
    time.nil? ? t("common.never") : time_ago_in_words(time)
  end
end
