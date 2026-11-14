require "rails_helper"

RSpec.describe Incident, type: :model do
  it "requires started_at" do
    expect(build(:incident, started_at: nil)).not_to be_valid
  end

  describe "ongoing scope" do
    it "includes unresolved and excludes resolved" do
      ongoing = create(:incident)
      resolved = create(:incident, :resolved)

      expect(Incident.ongoing).to include(ongoing)
      expect(Incident.ongoing).not_to include(resolved)
    end
  end

  describe "#ongoing? / #duration" do
    it "reports ongoing while unresolved" do
      expect(build(:incident)).to be_ongoing
      expect(build(:incident, :resolved)).not_to be_ongoing
    end

    it "computes duration until resolved_at or now" do
      travel_to(Time.current) do
        incident = build(:incident, started_at: 1.hour.ago, resolved_at: 30.minutes.ago)
        expect(incident.duration.to_i).to eq(1800)
        open = build(:incident, started_at: 1.hour.ago)
        expect(open.duration.to_i).to eq(3600)
      end
    end
  end
end
