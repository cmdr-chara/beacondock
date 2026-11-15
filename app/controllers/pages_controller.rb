# Public marketing page — the face of the app for anonymous visitors.
# Signed-in users always land on the dashboard instead.
class PagesController < ApplicationController
  allow_unauthenticated_access only: :landing
  layout false

  def landing
    redirect_to dashboard_path if authenticated?
  end
end
