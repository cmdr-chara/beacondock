module Api
  module V1
    # Base for the JSON API. Authentication is a Bearer API key
    # (`Authorization: Bearer bd_...`); the key's last_used_at is stamped
    # (throttled, see ApiKey::LAST_USED_WRITE_INTERVAL).
    #
    # All failures use one envelope: { "error": { "code": ..., "message": ... } }
    class BaseController < ActionController::API
      before_action :authenticate_api_key!

      rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
      rescue_from ActionController::ParameterMissing, with: :render_bad_request

      private
        attr_reader :current_api_key

        def current_user
          current_api_key.user
        end

        def authenticate_api_key!
          token = request.authorization.to_s[/\ABearer\s+(.+)\z/i, 1]
          @current_api_key = ApiKey.authenticate(token)

          render_error("unauthorized", "A valid API key is required", :unauthorized) unless current_api_key
        end

        def render_error(code, message, status, details = nil)
          body = { error: { code: code, message: message } }
          body[:error][:details] = details if details.present?
          render json: body, status: status
        end

        def render_not_found
          render_error("not_found", "Resource not found", :not_found)
        end

        def render_bad_request(exception)
          render_error("bad_request", exception.message, :bad_request)
        end
    end
  end
end
