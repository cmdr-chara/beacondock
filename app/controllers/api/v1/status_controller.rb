module Api
  module V1
    class StatusController < BaseController
      def show
        counts = current_user.monitors.group(:last_status).count
        counts.default = 0

        render json: {
          data: {
            total: counts.values.sum,
            active: current_user.monitors.active.count,
            counts: {
              pending: counts["pending"],
              up: counts["up"],
              down: counts["down"],
              degraded: counts["degraded"]
            },
            open_incidents: Incident.where(monitor: current_user.monitors).ongoing.count
          }
        }
      end
    end
  end
end
