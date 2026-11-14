require "rails_helper"

RSpec.describe "Dashboard", type: :request do
  let(:user) { create(:user) }

  before { sign_in(user) }

  it "lists the user's monitors as cards" do
    monitor = create(:monitor, user: user, name: "Card Test", public_on_status_page: false)
    create(:check, monitor: monitor, status: "up", checked_at: 5.minutes.ago)

    get root_path

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("Card Test")
    expect(response.body).to include("monitor-card")
    expect(response.body).to include(%(id="monitor_#{monitor.id}"))
  end

  it "subscribes to the user's monitor stream" do
    get root_path
    expect(response.body).to include("turbo-cable-stream-source")
  end

  it "does not show other users' monitors" do
    create(:monitor, user: create(:user), name: "Other User Monitor")
    get root_path
    expect(response.body).not_to include("Other User Monitor")
  end

  it "shows an empty state with no monitors" do
    get root_path
    expect(response.body).to include("empty-state")
  end

  it "renders in Italian when ?locale=it" do
    get root_path(locale: :it)
    expect(response.body).to include("Pannello di controllo")
  end
end
