require "rails_helper"

RSpec.describe MonitorStatusService, type: :service do
  let(:monitor) { create(:monitor) }
  let(:up_result) { HttpCheckService::Result.new(status: :up, http_status: 200, latency_ms: 50.0, error: nil) }
  let(:down_result) { HttpCheckService::Result.new(status: :down, http_status: 503, latency_ms: nil, error: "Expected HTTP 200, got 503") }
  let(:degraded_result) { HttpCheckService::Result.new(status: :degraded, http_status: 200, latency_ms: 3200.0, error: nil) }

  def record(result, m = monitor)
    described_class.new(m).record!(result)
    m.reload
  end

  it "persists a Check with the result fields" do
    expect { record(up_result) }.to change(monitor.checks, :count).by(1)

    check = monitor.checks.first
    expect(check.status).to eq("up")
    expect(check.http_status).to eq(200)
    expect(check.latency_ms).to eq(50.0)
    expect(check.checked_at).to be_present
  end

  it "updates monitor roll-up state" do
    travel_to(Time.current) do
      record(up_result)
      expect(monitor.last_status).to eq("up")
      expect(monitor.last_checked_at).to be_within(1.second).of(Time.current)
      expect(monitor.consecutive_failures).to eq(0)
      expect(monitor.next_check_at).to be_within(2.seconds).of(monitor.interval_seconds.seconds.from_now)
    end
  end

  it "increments consecutive_failures on down and resets on success" do
    record(down_result)
    expect(monitor.consecutive_failures).to eq(1)
    record(down_result)
    expect(monitor.consecutive_failures).to eq(2)
    record(up_result)
    expect(monitor.consecutive_failures).to eq(0)
  end

  describe "incidents (flap protection)" do
    it "does not open an incident on the first failure" do
      record(down_result)
      expect(monitor.incidents.ongoing).to be_empty
    end

    it "opens an incident at FAILURE_THRESHOLD consecutive failures" do
      MonitorStatusService::FAILURE_THRESHOLD.times { record(down_result) }

      incident = monitor.incidents.ongoing.first
      expect(incident).to be_present
      expect(incident.cause).to eq("Expected HTTP 200, got 503")
    end

    it "does not open a second incident while one is ongoing" do
      (MonitorStatusService::FAILURE_THRESHOLD + 2).times { record(down_result) }
      expect(monitor.incidents.ongoing.count).to eq(1)
    end

    it "auto-resolves the incident when the monitor recovers" do
      MonitorStatusService::FAILURE_THRESHOLD.times { record(down_result) }
      record(up_result)

      expect(monitor.incidents.ongoing).to be_empty
      expect(monitor.incidents.first.resolved_at).to be_present
    end

    it "a degraded check resets failures and resolves incidents" do
      record(down_result)
      record(degraded_result)
      expect(monitor.consecutive_failures).to eq(0)
      expect(monitor.incidents.ongoing).to be_empty
    end
  end

  describe "broadcasting" do
    it "broadcasts the refreshed card to the user's monitors stream" do
      expect(Turbo::StreamsChannel).to receive(:broadcast_replace_to)
        .with(monitor.user, :monitors, hash_including(target: monitor))
      described_class.new(monitor).record!(up_result)
    end
  end
end
