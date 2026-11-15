module AuthenticationHelpers
  # Signs in through the real session endpoint so cookie/session plumbing is
  # exercised exactly as in production.
  def sign_in(user, password: "password123")
    post session_path, params: { email_address: user.email_address, password: password }
    follow_redirect! if response.redirect?
  end
end

RSpec.configure do |config|
  config.include AuthenticationHelpers, type: :request
end
