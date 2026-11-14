require "rails_helper"

RSpec.describe PruneOldChecksJob, type: :job do
  it "deletes only checks older than the retention period" do
    monitor = create(:monitor)
    keep = create(:check, monitor: monitor, checked_at: 2.days.ago)
    stale = create(:check, monitor: monitor, checked_at: 45.days.ago)

    described_class.perform_now

    expect(Check.exists?(keep.id)).to be true
    expect(Check.exists?(stale.id)).to be false
  end
end
