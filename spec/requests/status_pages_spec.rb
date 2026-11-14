require "rails_helper"

RSpec.describe "Public status page", type: :request do
  let(:user) { create(:user) }
  let(:token) { user.status_page_token }

  it "is accessible without authentication" do
    get status_page_path(token: token)
    expect(response).to have_http_status(:ok)
  end

  it "lists only public monitors" do
    create(:monitor, :public, user: user, name: "Public Site")
    create(:monitor, user: user, name: "Private Site")

    get status_page_path(token: token)

    expect(response.body).to include("Public Site")
    expect(response.body).not_to include("Private Site")
  end

  it "shows host only — never the full URL with potential secrets" do
    create(:monitor, :public, user: user, url: "https://hidden.example.com/health?token=TOPSECRET")

    get status_page_path(token: token)

    expect(response.body).to include("hidden.example.com")
    expect(response.body).not_to include("TOPSECRET")
  end

  it "shows the operational banner and recent incidents" do
    monitor = create(:monitor, :public, user: user)
    MonitorStatusService.new(monitor).record!(
      HttpCheckService::Result.new(status: :up, http_status: 200, latency_ms: 50, error: nil))
    create(:incident, monitor: monitor, started_at: 1.day.ago, resolved_at: 23.hours.ago)

    get status_page_path(token: token)

    expect(response.body).to include("All systems operational")
    expect(response.body).to include("Recent incidents")
  end

  it "shows a degraded banner when a public monitor is down" do
    monitor = create(:monitor, :public, user: user, last_status: :down)

    get status_page_path(token: token)
    expect(response.body).to include("experiencing issues")
  end

  it "404s on an unknown token" do
    get "/status/nonexistent-token"
    expect(response).to have_http_status(:not_found)
  end
end
