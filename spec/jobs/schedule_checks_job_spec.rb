require "rails_helper"

RSpec.describe ScheduleChecksJob, type: :job do
  it "enqueues a CheckMonitorJob for each due active monitor" do
    due = create(:monitor, :due)
    create(:monitor, next_check_at: 10.minutes.from_now)
    create(:monitor, :inactive, next_check_at: 1.minute.ago)

    expect { described_class.perform_now }
      .to have_enqueued_job(CheckMonitorJob).with(due.id).exactly(:once)
  end

  it "pushes next_check_at forward before enqueueing (overlap control)" do
    monitor = create(:monitor, :due, interval_seconds: 60)

    described_class.perform_now

    expect(monitor.reload.next_check_at).to be > 30.seconds.from_now
    # A second sweep must not re-enqueue it.
    expect { described_class.perform_now }.not_to have_enqueued_job(CheckMonitorJob)
  end

  it "enqueues nothing when nothing is due" do
    create(:monitor, next_check_at: 1.hour.from_now)
    expect { described_class.perform_now }.not_to have_enqueued_job(CheckMonitorJob)
  end
end
