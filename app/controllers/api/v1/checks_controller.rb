module Api
  module V1
    class ChecksController < BaseController
      MAX_PER_PAGE = 100

      def index
        monitor = current_user.monitors.find(params[:monitor_id])
        scope = monitor.checks.recent
        total = scope.count

        checks = scope.offset((page - 1) * per_page).limit(per_page)

        render json: {
          data: checks.map { |c| check_json(c) },
          meta: {
            page: page,
            per_page: per_page,
            total_count: total,
            total_pages: (total.to_f / per_page).ceil
          }
        }
      end

      private
        def page
          [ params.fetch(:page, 1).to_i, 1 ].max
        end

        def per_page
          requested = params.fetch(:per_page, 50).to_i
          requested.clamp(1, MAX_PER_PAGE)
        end

        def check_json(check)
          {
            id: check.id,
            status: check.status,
            http_status: check.http_status,
            latency_ms: check.latency_ms,
            error: check.error,
            checked_at: check.checked_at
          }
        end
    end
  end
end
