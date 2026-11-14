module MonitorsHelper
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

    tag.svg(class: "sparkline", width: width, height: height, viewBox: "0 0 #{width} #{height}",
      role: "img", "aria-label": t("monitors.latency_sparkline")) do
      tag.polyline(points: coordinates.join(" "), fill: "none", stroke: "currentColor",
        "stroke-width": 1.5, "stroke-linejoin": "round", "stroke-linecap": "round")
    end
  end
end
