require "rails_helper"

RSpec.describe CheckMonitorJob, type: :job do
  let(:monitor) { create(:monitor, url: "https://example.com/ok") }

  it "runs the check pipeline and records a check" do
    stub_request(:get, "https://example.com/ok").to_return(status: 200)

    expect { described_class.perform_now(monitor.id) }
      .to change { monitor.checks.count }.by(1)
    expect(monitor.reload.last_status).to eq("up")
  end

  it "records a down check when the HTTP call fails — never silently healthy" do
    stub_request(:get, "https://example.com/ok").to_timeout

    described_class.perform_now(monitor.id)

    expect(monitor.reload.last_status).to eq("down")
    expect(monitor.checks.first.status).to eq("down")
  end

  it "skips inactive monitors without recording" do
    monitor.update!(active: false)

    expect { described_class.perform_now(monitor.id) }
      .not_to change { monitor.checks.count }
  end

  it "is discarded when the monitor is gone" do
    expect {
      described_class.perform_now(SiteMonitor.maximum(:id).to_i + 999)
    }.not_to raise_error
  end
end
