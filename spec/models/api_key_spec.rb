require "rails_helper"

RSpec.describe ApiKey, type: :model do
  describe "token generation" do
    it "generates a bd_ token, stores only the digest and prefix" do
      key = create(:api_key)

      expect(key.raw_token).to start_with("bd_")
      expect(key.token_digest).to eq(ApiKey.digest(key.raw_token))
      expect(key.token_digest).not_to include(key.raw_token)
      # raw_token is transient: a record reloaded from the DB has none.
      expect(ApiKey.find(key.id).raw_token).to be_nil
      expect(key.token_prefix).to eq(key.raw_token.first(12))
    end
  end

  describe ".authenticate" do
    it "returns the key for a valid token and stamps last_used_at" do
      key = create(:api_key)

      travel_to(1.minute.from_now) do
        found = ApiKey.authenticate(key.raw_token)
        expect(found).to eq(key)
        expect(found.last_used_at).to be_within(2.seconds).of(Time.current)
      end
    end

    it "returns nil for unknown tokens" do
      expect(ApiKey.authenticate("bd_nope")).to be_nil
      expect(ApiKey.authenticate(nil)).to be_nil
      expect(ApiKey.authenticate("")).to be_nil
    end

    it "returns nil for revoked keys" do
      key = create(:api_key)
      key.revoke!
      expect(ApiKey.authenticate(key.raw_token)).to be_nil
    end
  end

  describe "#revoke!" do
    it "sets revoked_at" do
      key = create(:api_key)
      expect { key.revoke! }.to change { key.revoked? }.from(false).to(true)
    end
  end

  describe "#masked_token" do
    it "shows only the prefix" do
      key = create(:api_key)
      expect(key.masked_token).to start_with(key.token_prefix)
      expect(key.masked_token).not_to eq(key.raw_token)
    end
  end
end
