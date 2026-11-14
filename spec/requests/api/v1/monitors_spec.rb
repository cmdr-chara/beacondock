require "rails_helper"

RSpec.describe "API v1 monitors", type: :request do
  let(:user) { create(:user) }
  let(:api_key) { create(:api_key, user: user) }
  let(:headers) { { "Authorization" => "Bearer #{api_key.raw_token}" } }
  let(:json) { response.parsed_body }

  describe "authentication" do
    it "returns 401 JSON envelope with no key" do
      get "/api/v1/monitors"
      expect(response).to have_http_status(:unauthorized)
      expect(json.dig("error", "code")).to eq("unauthorized")
    end

    it "returns 401 with an invalid key" do
      get "/api/v1/monitors", headers: { "Authorization" => "Bearer bd_invalid" }
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 401 with a revoked key" do
      api_key.revoke!
      get "/api/v1/monitors", headers: headers
      expect(response).to have_http_status(:unauthorized)
    end

    it "stamps last_used_at on the key" do
      get "/api/v1/monitors", headers: headers
      expect(api_key.reload.last_used_at).to be_present
    end
  end

  describe "GET /api/v1/monitors" do
    it "lists the authenticated user's monitors" do
      create(:monitor, user: user, name: "Mine")
      create(:monitor, user: create(:user), name: "Not mine")

      get "/api/v1/monitors", headers: headers

      expect(response).to have_http_status(:ok)
      names = json["data"].map { |m| m["name"] }
      expect(names).to include("Mine")
      expect(names).not_to include("Not mine")
    end
  end

  describe "GET /api/v1/monitors/:id" do
    it "returns the monitor" do
      monitor = create(:monitor, user: user)
      get "/api/v1/monitors/#{monitor.id}", headers: headers

      expect(json.dig("data", "id")).to eq(monitor.id)
      expect(json.dig("data", "url")).to eq(monitor.url)
    end

    it "404s on another user's monitor" do
      other = create(:monitor, user: create(:user))
      get "/api/v1/monitors/#{other.id}", headers: headers
      expect(response).to have_http_status(:not_found)
      expect(json.dig("error", "code")).to eq("not_found")
    end
  end

  describe "POST /api/v1/monitors" do
    let(:params) do
      { monitor: { name: "API monitor", url: "https://api.example.com", interval_seconds: 60 } }
    end

    it "creates a monitor with 201" do
      expect { post "/api/v1/monitors", params: params.to_json, headers: headers.merge("Content-Type" => "application/json") }
        .to change(user.monitors, :count).by(1)
      expect(response).to have_http_status(:created)
      expect(json.dig("data", "name")).to eq("API monitor")
    end

    it "returns a validation error envelope" do
      post "/api/v1/monitors", params: { monitor: { name: "x", url: "bad" } }.to_json,
        headers: headers.merge("Content-Type" => "application/json")

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json.dig("error", "code")).to eq("validation_failed")
    end

    it "returns 400 when the monitor key is missing" do
      post "/api/v1/monitors", params: {}.to_json,
        headers: headers.merge("Content-Type" => "application/json")

      expect(response).to have_http_status(:bad_request)
      expect(json.dig("error", "code")).to eq("bad_request")
    end
  end

  describe "PATCH /api/v1/monitors/:id" do
    it "updates the monitor" do
      monitor = create(:monitor, user: user)
      patch "/api/v1/monitors/#{monitor.id}",
        params: { monitor: { name: "Updated" } }.to_json,
        headers: headers.merge("Content-Type" => "application/json")

      expect(json.dig("data", "name")).to eq("Updated")
      expect(monitor.reload.name).to eq("Updated")
    end
  end

  describe "DELETE /api/v1/monitors/:id" do
    it "deletes with 204" do
      monitor = create(:monitor, user: user)
      expect { delete "/api/v1/monitors/#{monitor.id}", headers: headers }
        .to change(user.monitors, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end
  end
end
