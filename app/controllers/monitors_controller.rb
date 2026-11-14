class MonitorsController < ApplicationController
  before_action :set_monitor, only: %i[show edit update destroy check]

  def show
    @checks = @monitor.checks.limit(50)
    @incidents = @monitor.incidents.limit(20)
  end

  def new
    @monitor = Current.user.monitors.build
  end

  def create
    @monitor = Current.user.monitors.build(monitor_params)

    if @monitor.save
      redirect_to @monitor, notice: t(".notice")
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @monitor.update(monitor_params)
      redirect_to @monitor, notice: t(".notice")
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @monitor.destroy!
    redirect_to root_path, notice: t(".notice"), status: :see_other
  end

  def check
    if @monitor.active?
      CheckMonitorJob.perform_later(@monitor.id)
      redirect_to @monitor, notice: t(".notice"), status: :see_other
    else
      redirect_to @monitor, alert: t(".inactive"), status: :see_other
    end
  end

  private
    def set_monitor
      @monitor = Current.user.monitors.find(params[:id])
    end

    def monitor_params
      params.expect(monitor: %i[name url http_method interval_seconds timeout_seconds
        expected_status warn_latency_ms active public_on_status_page])
    end
end
