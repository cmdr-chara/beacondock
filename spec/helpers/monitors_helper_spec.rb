require "rails_helper"

RSpec.describe MonitorsHelper, type: :helper do
  let(:monitor) { create(:monitor) }

  it "renders an empty state with fewer than two points" do
    expect(helper.latency_sparkline(monitor)).to include("sparkline-empty")
  end

  it "renders an svg polyline scaled to the data" do
    create_list(:check, 5, monitor: monitor, latency_ms: 100)
    html = helper.latency_sparkline(monitor)

    expect(html).to include("<svg")
    expect(html).to include("polyline")
    expect(html).to include("points=")
  end

  it "handles zero-max data gracefully" do
    create_list(:check, 3, monitor: monitor, latency_ms: 0)
    expect { helper.latency_sparkline(monitor) }.not_to raise_error
  end
end
