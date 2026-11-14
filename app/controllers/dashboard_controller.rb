class DashboardController < ApplicationController
  def index
    @monitors = Current.user.monitors.order(created_at: :desc)
  end
end
