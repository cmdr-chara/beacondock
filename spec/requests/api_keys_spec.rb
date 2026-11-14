require "rails_helper"

RSpec.describe "API keys UI", type: :request do
  let(:user) { create(:user) }

  before { sign_in(user) }

  it "lists keys" do
    create(:api_key, user: user, name: "listed-key")
    get api_keys_path
    expect(response.body).to include("listed-key")
  end

  it "creates a key and reveals the raw token once" do
    expect {
      post api_keys_path, params: { api_key: { name: "cli" } }
    }.to change(user.api_keys, :count).by(1)

    expect(response).to have_http_status(:created)
    key = user.api_keys.find_by(name: "cli")

    # The revealed token in the page must hash to the stored digest.
    revealed = response.body[/(bd_[\w-]{20,})/, 1]
    expect(revealed).to be_present
    expect(ApiKey.digest(revealed)).to eq(key.token_digest)

    # The raw token is not persisted and never shown again.
    get api_keys_path
    expect(response.body).not_to include(revealed)
  end

  it "rejects a blank name" do
    post api_keys_path, params: { api_key: { name: "" } }
    expect(response).to have_http_status(:unprocessable_entity)
  end

  it "revokes a key" do
    key = create(:api_key, user: user)
    delete api_key_path(key)
    expect(key.reload).to be_revoked
  end

  it "cannot revoke another user's key" do
    other = create(:api_key, user: create(:user))
    delete api_key_path(other)
    expect(response).to have_http_status(:not_found)
    expect(other.reload).not_to be_revoked
  end
end
