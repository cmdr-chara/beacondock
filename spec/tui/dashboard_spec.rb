require "rails_helper"

RSpec.describe Tui::Dashboard do
  subject(:dashboard) { described_class.new(io: StringIO.new, color: false) }

  it "renders each monitor with status, latency and uptime" do
    monitor = create(:monitor, name: "API", last_status: :up, interval_seconds: 60)
    create(:check, monitor: monitor, status: "up", latency_ms: 84.0)
    create(:check, monitor: monitor, status: "down", checked_at: 2.days.ago)

    frame = dashboard.frame

    expect(frame).to include("API")
    expect(frame).to include("up")
    expect(frame).to include("84 ms")
    expect(frame).to include("uptime")
    expect(frame).to include("30d")
  end

  it "marks degraded and down monitors with their own glyphs" do
    create(:monitor, name: "Degraded one", last_status: :degraded)
    create(:monitor, name: "Down one", last_status: :down)

    frame = dashboard.frame

    expect(frame).to include("◐ degraded")
    expect(frame).to include("✕ down")
  end

  it "renders incidents as an event log with durations" do
    monitor = create(:monitor)
    create(:incident, :resolved, monitor: monitor,
      started_at: 10.minutes.ago, resolved_at: 7.minutes.ago, cause: "HTTP 503")

    frame = dashboard.frame

    expect(frame).to include("recent events")
    expect(frame).to include("HTTP 503")
    expect(frame).to include("resolved after 3m")
  end

  it "renders an empty state when there are no monitors" do
    expect(dashboard.frame).to include("no monitors yet")
  end

  it "emits no ANSI codes when color is disabled" do
    create(:monitor)
    expect(dashboard.frame).not_to include("\e[")
  end

  it "prints a single frame and returns with once: true" do
    io = StringIO.new
    described_class.new(io: io, once: true, color: false).run
    expect(io.string).to include("beacondock")
    expect(io.string).to include("monitors")
  end

  it "truncates long monitor names" do
    create(:monitor, name: "a" * 40)
    expect(dashboard.frame).to include("…")
  end

  it "renders a monitor detail view with status, uptime and recent checks" do
    monitor = create(:monitor, name: "Billing", last_status: :up, expected_status: 200)
    create(:check, monitor: monitor, status: "up", http_status: 200, latency_ms: 90.0)
    create(:check, monitor: monitor, status: "down", http_status: 503, checked_at: 3.minutes.ago)

    frame = dashboard.detail_frame(monitor)

    expect(frame).to include("Billing")
    expect(frame).to include("monitor detail")
    expect(frame).to include("24h")
    expect(frame).to include("30d")
    expect(frame).to include("recent checks")
    expect(frame).to include("90 ms")
    expect(frame).to include("503")
    expect(frame).to include("esc back")
  end

  it "routes frame to the detail view after open_detail" do
    create(:monitor, name: "API")
    create(:monitor, name: "Billing")

    dashboard.frame # list render populates the selectable monitors
    dashboard.move_selection(1)
    dashboard.open_detail

    frame = dashboard.frame
    expect(frame).to include("Billing")
    expect(frame).to include("monitor detail")
  end

  it "clamps selection within the monitor list" do
    create(:monitor, name: "API")
    create(:monitor, name: "Billing")

    dashboard.frame
    dashboard.move_selection(-5)
    dashboard.open_detail
    expect(dashboard.frame).to include("API")
  end
end
