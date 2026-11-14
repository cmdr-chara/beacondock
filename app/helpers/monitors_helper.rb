module MonitorsHelper
  # Worst check status per day, oldest first — drives the 30-cell uptime
  # strip on the public status page. A day takes its worst observed status
  # (down > degraded > up); days without checks stay empty (grey).
  STATUS_SEVERITY = { "down" => 3, "degraded" => 2, "up" => 1 }.freeze

  def status_bars(monitor, days: 30)
    since = days.days.ago.beginning_of_day
    by_day = monitor.checks.where(checked_at: since..)
      .pluck(:checked_at, :status)
      .group_by { |checked_at, _status| checked_at.to_date }

    (0...days).map do |i|
      date = Date.current - (days - 1 - i)
      statuses = by_day.fetch(date, []).map(&:last)
      { date: date, status: statuses.max_by { |s| STATUS_SEVERITY.fetch(s, 0) } }
    end
  end

  # Renders a tiny inline SVG polyline of recent latencies — no chart
  # library needed. Values are scaled to the window's own max.
  def latency_sparkline(monitor, width: 140, height: 32)
    points = monitor.recent_latencies(30)
    return tag.span(t("common.no_data"), class: "sparkline-empty") if points.size < 2

    max = points.max
    max = 1.0 if max.zero?
    step_x = width.to_f / (points.size - 1)

    coordinates = points.each_with_index.map do |value, i|
      x = (i * step_x).round(1)
      y = (height - 2 - (value / max) * (height - 4)).round(1)
      "#{x},#{y}"
    end

    area = "M0,#{height} L#{coordinates.join(" L")} L#{width},#{height} Z"

    tag.svg(class: "sparkline", width: width, height: height, viewBox: "0 0 #{width} #{height}",
      role: "img", "aria-label": t("monitors.latency_sparkline")) do
      safe_join([
        tag.path(d: area, class: "sparkline-area"),
        tag.polyline(points: coordinates.join(" "), class: "sparkline-line", fill: "none",
          stroke: "currentColor", "stroke-width": 1.5, "stroke-linejoin": "round", "stroke-linecap": "round")
      ])
    end
  end
end
