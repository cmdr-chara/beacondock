require "rails_helper"

RSpec.describe "Authentication", type: :request do
  describe "sign in" do
    let(:user) { create(:user) }

    it "renders the sign-in form" do
      get new_session_path
      expect(response).to have_http_status(:ok)
    end

    it "signs in with valid credentials and redirects to dashboard" do
      post session_path, params: { email_address: user.email_address, password: "password123" }

      expect(response).to redirect_to(dashboard_path)
      follow_redirect!
      expect(response.body).to include("Dashboard")
    end

    it "rejects bad credentials" do
      post session_path, params: { email_address: user.email_address, password: "wrong" }
      expect(response).to redirect_to(new_session_path)
      follow_redirect!
      expect(flash[:alert]).to be_present
    end

    it "signs out" do
      sign_in(user)
      delete session_path
      expect(response).to redirect_to(new_session_path)

      get dashboard_path
      expect(response).to redirect_to(new_session_path)
    end
  end

  describe "sign up" do
    it "renders the registration form" do
      get sign_up_path
      expect(response).to have_http_status(:ok)
    end

    it "creates a user and signs them in" do
      expect {
        post sign_up_path, params: { user: {
          email_address: "new@example.com", password: "password123", password_confirmation: "password123"
        } }
      }.to change(User, :count).by(1)

      expect(response).to redirect_to(dashboard_path)
      follow_redirect!
      expect(response.body).to include("Dashboard")
    end

    it "re-renders with errors on invalid input" do
      post sign_up_path, params: { user: {
        email_address: "bad", password: "password123", password_confirmation: "nope"
      } }
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "redirects already-signed-in visitors away" do
      sign_in(create(:user))
      get sign_up_path
      expect(response).to redirect_to(dashboard_path)
    end
  end

  describe "protected pages" do
    it "redirects unauthenticated visitors to sign-in" do
      get dashboard_path
      expect(response).to redirect_to(new_session_path)
    end

    it "returns to the originally requested page after sign-in" do
      monitor = create(:monitor)
      get monitor_path(monitor)
      expect(response).to redirect_to(new_session_path)

      post session_path, params: { email_address: monitor.user.email_address, password: "password123" }
      expect(response).to redirect_to(monitor_path(monitor))
    end
  end
end
