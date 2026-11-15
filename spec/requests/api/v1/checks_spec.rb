require "rails_helper"

RSpec.describe "API v1 checks", type: :request do
  let(:user) { create(:user) }
  let(:api_key) { create(:api_key, user: user) }
  let(:headers) { { "Authorization" => "Bearer #{api_key.raw_token}" } }
  let(:monitor) { create(:monitor, user: user) }
  let(:json) { response.parsed_body }

  before { create_list(:check, 60, monitor: monitor) }

  it "returns paginated checks newest first" do
    get "/api/v1/monitors/#{monitor.id}/checks", headers: headers

    expect(response).to have_http_status(:ok)
    expect(json["data"].size).to eq(50)
    expect(json.dig("meta", "total_count")).to eq(60)
    expect(json.dig("meta", "total_pages")).to eq(2)
    expect(json["data"].first.dig("checked_at")).to be >= json["data"].last.dig("checked_at")
  end

  it "respects page and per_page params" do
    get "/api/v1/monitors/#{monitor.id}/checks", params: { page: 2, per_page: 10 }, headers: headers

    expect(json["data"].size).to eq(10)
    expect(json.dig("meta", "page")).to eq(2)
  end

  it "clamps per_page to the maximum" do
    get "/api/v1/monitors/#{monitor.id}/checks", params: { per_page: 10_000 }, headers: headers
    expect(json.dig("meta", "per_page")).to eq(100)
  end

  it "404s for another user's monitor" do
    other = create(:monitor, user: create(:user))
    get "/api/v1/monitors/#{other.id}/checks", headers: headers
    expect(response).to have_http_status(:not_found)
  end

  it "requires auth" do
    get "/api/v1/monitors/#{monitor.id}/checks"
    expect(response).to have_http_status(:unauthorized)
  end
end
