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
    expect(frame).to include("uptime 30d")
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
end
