require "rails_helper"

RSpec.describe SiteMonitor, type: :model do
  describe "model_name" do
    it "keeps the public 'Monitor' naming contract" do
      expect(SiteMonitor.model_name.name).to eq("Monitor")
      expect(SiteMonitor.model_name.route_key).to eq("monitors")
      expect(SiteMonitor.model_name.param_key).to eq("monitor")
    end
  end

  describe "validations" do
    it "is valid with defaults" do
      expect(build(:monitor)).to be_valid
    end

    it "requires a name" do
      expect(build(:monitor, name: nil)).not_to be_valid
    end

    it "rejects non-http URLs" do
      expect(build(:monitor, url: "ftp://example.com")).not_to be_valid
      expect(build(:monitor, url: "not a url")).not_to be_valid
      expect(build(:monitor, url: nil)).not_to be_valid
    end

    it "rejects unsupported HTTP methods" do
      expect(build(:monitor, http_method: "POST")).not_to be_valid
      expect(build(:monitor, http_method: "HEAD")).to be_valid
    end

    it "rejects intervals outside the allowed set" do
      expect(build(:monitor, interval_seconds: 45)).not_to be_valid
      expect(build(:monitor, interval_seconds: 60)).to be_valid
    end

    it "bounds timeout_seconds" do
      expect(build(:monitor, timeout_seconds: 0)).not_to be_valid
      expect(build(:monitor, timeout_seconds: 31)).not_to be_valid
      expect(build(:monitor, timeout_seconds: 30)).to be_valid
    end

    it "bounds expected_status" do
      expect(build(:monitor, expected_status: 99)).not_to be_valid
      expect(build(:monitor, expected_status: 200)).to be_valid
    end
  end

  describe "scheduling" do
    it "is due immediately after create" do
      monitor = create(:monitor)
      expect(monitor.next_check_at).to be_within(2.seconds).of(Time.current)
      expect(SiteMonitor.due_for_check).to include(monitor)
    end

    it "is not due when next_check_at is in the future" do
      monitor = create(:monitor, next_check_at: 5.minutes.from_now)
      expect(SiteMonitor.due_for_check).not_to include(monitor)
    end

    it "re-arms next_check_at when interval changes" do
      monitor = create(:monitor, next_check_at: 1.hour.from_now)
      monitor.update!(interval_seconds: 60)
      expect(monitor.next_check_at).to be_within(2.seconds).of(Time.current)
    end

    it "re-arms when reactivated" do
      monitor = create(:monitor, :inactive, next_check_at: nil)
      monitor.update!(active: true)
      expect(monitor.next_check_at).to be_within(2.seconds).of(Time.current)
    end
  end

  describe "#host" do
    it "returns only the host, hiding path/query secrets" do
      monitor = build(:monitor, url: "https://example.com/health?token=secret123")
      expect(monitor.host).to eq("example.com")
      expect(monitor.host).not_to include("secret123")
    end

    it "falls back to raw url when unparsable" do
      monitor = build(:monitor)
      monitor.url = "::::"
      expect(monitor.host).to eq("::::")
    end
  end

  describe "#uptime_percentage" do
    let(:monitor) { create(:monitor) }

    it "is nil with no checks" do
      expect(monitor.uptime_percentage(24.hours)).to be_nil
    end

    it "counts up and degraded as available, down as unavailable" do
      create_list(:check, 6, monitor: monitor, checked_at: 1.hour.ago)
      create_list(:check, 2, :degraded, monitor: monitor, checked_at: 1.hour.ago)
      create_list(:check, 2, :down, monitor: monitor, checked_at: 1.hour.ago)

      expect(monitor.uptime_percentage(24.hours)).to eq(80.0)
    end

    it "ignores checks outside the window" do
      create(:check, :down, monitor: monitor, checked_at: 25.hours.ago)
      create(:check, monitor: monitor, checked_at: 1.hour.ago)

      expect(monitor.uptime_percentage(24.hours)).to eq(100.0)
      expect(monitor.uptime_percentage(30.days)).to eq(50.0)
    end
  end

  describe "#operational?" do
    it "is true for up and degraded, false for down and pending" do
      monitor = build(:monitor)
      monitor.last_status = :up
      expect(monitor).to be_operational
      monitor.last_status = :degraded
      expect(monitor).to be_operational
      monitor.last_status = :down
      expect(monitor).not_to be_operational
      monitor.last_status = :pending
      expect(monitor).not_to be_operational
    end
  end

  describe "last_status enum" do
    it "defaults to pending — never treated as healthy" do
      monitor = create(:monitor)
      expect(monitor).to be_last_status_pending
      expect(monitor).not_to be_operational
    end
  end
end
