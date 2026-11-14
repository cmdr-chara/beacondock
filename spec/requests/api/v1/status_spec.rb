require "rails_helper"

RSpec.describe "API v1 status", type: :request do
  let(:user) { create(:user) }
  let(:api_key) { create(:api_key, user: user) }
  let(:headers) { { "Authorization" => "Bearer #{api_key.raw_token}" } }
  let(:json) { response.parsed_body }

  it "summarizes monitor counts by status" do
    create(:monitor, user: user, last_status: :up)
    create(:monitor, user: user, last_status: :up)
    create(:monitor, user: user, last_status: :down)
    create(:monitor, :inactive, user: user)
    create(:monitor, user: create(:user), last_status: :down)

    get "/api/v1/status", headers: headers

    expect(response).to have_http_status(:ok)
    data = json["data"]
    expect(data["total"]).to eq(4)
    expect(data["active"]).to eq(3)
    expect(data.dig("counts", "up")).to eq(2)
    expect(data.dig("counts", "down")).to eq(1)
    expect(data.dig("counts", "pending")).to eq(1)
    expect(data["open_incidents"]).to eq(0)
  end

  it "requires auth" do
    get "/api/v1/status"
    expect(response).to have_http_status(:unauthorized)
  end
end
