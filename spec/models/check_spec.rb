require "rails_helper"

RSpec.describe Check, type: :model do
  describe "validations" do
    it "is valid with defaults" do
      expect(build(:check)).to be_valid
    end

    it "requires checked_at" do
      expect(build(:check, checked_at: nil)).not_to be_valid
    end

    it "requires a status" do
      expect(build(:check, status: nil)).not_to be_valid
    end

    it "allows nil http_status and latency for network failures" do
      check = build(:check, status: "down", http_status: nil, latency_ms: nil)
      expect(check).to be_valid
    end
  end

  describe "scopes" do
    let(:monitor) { create(:monitor) }

    it "orders recent first" do
      old = create(:check, monitor: monitor, checked_at: 2.hours.ago)
      recent = create(:check, monitor: monitor, checked_at: 1.minute.ago)
      expect(monitor.checks.recent.first).to eq(recent)
      expect(monitor.checks.recent.last).to eq(old)
    end

    it "selects rows older than the retention period" do
      fresh = create(:check, monitor: monitor, checked_at: 1.day.ago)
      stale = create(:check, monitor: monitor, checked_at: 31.days.ago)

      expect(Check.older_than_retention).to include(stale)
      expect(Check.older_than_retention).not_to include(fresh)
    end
  end
end
