# Public, unauthenticated status page. Each user has an unguessable
# status_page_token; the page exposes only monitors flagged
# public_on_status_page and never reveals full URLs (host only, since URLs
# may embed secret tokens).
class StatusPagesController < ApplicationController
  allow_unauthenticated_access only: :show

  def show
    @user = User.find_by!(status_page_token: params[:token])
    @monitors = @user.monitors.publicly_visible.order(:name)
    @recent_incidents = Incident.where(monitor: @monitors)
      .where(started_at: 14.days.ago..)
      .includes(:monitor)
      .order(started_at: :desc)
      .limit(20)
  end
end
