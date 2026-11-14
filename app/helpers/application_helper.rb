module ApplicationHelper
  # Beacon mark: a status dot with two signal arcs — the product's identity
  # (uptime = a signal that keeps arriving).
  def brand_mark(extra_class: nil)
    tag.svg(class: [ "brand-mark", extra_class ].compact.join(" "), viewBox: "0 0 24 24",
      fill: "none", "aria-hidden": "true") do
      safe_join([
        tag.circle(cx: 12, cy: 12, r: 3, fill: "currentColor"),
        tag.path(d: "M6.5 12a5.5 5.5 0 0 1 11 0", stroke: "currentColor", "stroke-width": 1.8,
          "stroke-linecap": "round"),
        tag.path(d: "M3.5 12a8.5 8.5 0 0 1 17 0", stroke: "currentColor", "stroke-width": 1.8,
          "stroke-linecap": "round", opacity: 0.45)
      ])
    end
  end

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
