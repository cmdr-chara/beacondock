class ApplicationController < ActionController::Base
  include Authentication

  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Changes to the importmap will invalidate the etag for HTML responses
  stale_when_importmap_changes

  around_action :switch_locale

  private
    # ?locale=en|it wins, then the cookie, then the default. A valid choice is
    # remembered in a cookie so links keep the visitor's language.
    def switch_locale(&action)
      locale = params[:locale].presence || cookies[:locale] || I18n.default_locale
      locale = I18n.default_locale unless locale.to_s.in?(I18n.available_locales.map(&:to_s))

      if params[:locale].present?
        cookies[:locale] = { value: locale, expires: 1.year.from_now, same_site: :lax }
      end

      I18n.with_locale(locale, &action)
    end
end
