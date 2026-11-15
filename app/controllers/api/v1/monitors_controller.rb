module Api
  module V1
    class MonitorsController < BaseController
      before_action :set_monitor, only: %i[show update destroy]

      def index
        render json: { data: current_user.monitors.order(:id).map { |m| monitor_json(m) } }
      end

      def show
        render json: { data: monitor_json(@monitor) }
      end

      def create
        monitor = current_user.monitors.build(monitor_params)

        if monitor.save
          render json: { data: monitor_json(monitor) }, status: :created
        else
          render_error("validation_failed", "Monitor could not be saved", :unprocessable_entity, monitor.errors.as_json)
        end
      end

      def update
        if @monitor.update(monitor_params)
          render json: { data: monitor_json(@monitor) }
        else
          render_error("validation_failed", "Monitor could not be saved", :unprocessable_entity, @monitor.errors.as_json)
        end
      end

      def destroy
        @monitor.destroy!
        head :no_content
      end

      private
        def set_monitor
          @monitor = current_user.monitors.find(params[:id])
        end

        def monitor_params
          params.expect(monitor: %i[name url http_method interval_seconds timeout_seconds
            expected_status warn_latency_ms active])
        end

        def monitor_json(monitor)
          {
            id: monitor.id,
            name: monitor.name,
            url: monitor.url,
            host: monitor.host,
            http_method: monitor.http_method,
            interval_seconds: monitor.interval_seconds,
            timeout_seconds: monitor.timeout_seconds,
            expected_status: monitor.expected_status,
            warn_latency_ms: monitor.warn_latency_ms,
            active: monitor.active,
            last_status: monitor.last_status,
            last_checked_at: monitor.last_checked_at,
            consecutive_failures: monitor.consecutive_failures,
            uptime_24h: monitor.uptime_percentage(24.hours),
            uptime_30d: monitor.uptime_percentage(30.days),
            created_at: monitor.created_at,
            updated_at: monitor.updated_at
          }
        end
    end
  end
end
