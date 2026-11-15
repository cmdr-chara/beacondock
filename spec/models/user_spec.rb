require "rails_helper"

RSpec.describe User, type: :model do
  describe "validations" do
    it "is valid with default attributes" do
      expect(build(:user)).to be_valid
    end

    it "requires an email address" do
      expect(build(:user, email_address: nil)).not_to be_valid
    end

    it "requires a valid email format" do
      expect(build(:user, email_address: "not-an-email")).not_to be_valid
    end

    it "requires a unique email, case-insensitive via normalization" do
      create(:user, email_address: "dup@example.com")
      expect(build(:user, email_address: "  DUP@EXAMPLE.COM ")).not_to be_valid
    end

    it "normalizes email address" do
      user = create(:user, email_address: "  Mixed@Example.COM ")
      expect(user.email_address).to eq("mixed@example.com")
    end
  end

  describe "associations" do
    it "destroys dependent monitors" do
      user = create(:user)
      create(:monitor, user: user)
      expect { user.destroy }.to change(SiteMonitor, :count).by(-1)
    end

    it "destroys dependent api keys" do
      user = create(:user)
      create(:api_key, user: user)
      expect { user.destroy }.to change(ApiKey, :count).by(-1)
    end
  end
end
