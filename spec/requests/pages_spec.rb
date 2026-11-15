require "rails_helper"

RSpec.describe "Landing page", type: :request do
  it "renders for anonymous visitors" do
    get root_path
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("BeaconDock")
  end

  it "renders in Italian" do
    get root_path(locale: :it)
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("monitorare")
  end

  it "redirects signed-in users to the dashboard" do
    sign_in(create(:user))
    get root_path
    expect(response).to redirect_to(dashboard_path)
  end

  it "serves the self-hosted mono font" do
    get "/fonts/geist-mono-latin-400-normal.woff2"
    expect(response).to have_http_status(:ok)
  end
end
