class ApiKeysController < ApplicationController
  def index
    @api_keys = Current.user.api_keys.order(created_at: :desc)
    @api_key = Current.user.api_keys.build
  end

  def create
    @api_key = Current.user.api_keys.build(api_key_params)

    if @api_key.save
      # @api_key.raw_token is displayed exactly once here; only its digest
      # is persisted afterwards.
      @api_keys = Current.user.api_keys.order(created_at: :desc)
      render :index, status: :created
    else
      @api_keys = Current.user.api_keys.order(created_at: :desc)
      render :index, status: :unprocessable_entity
    end
  end

  def destroy
    Current.user.api_keys.find(params[:id]).revoke!
    redirect_to api_keys_path, notice: t(".notice"), status: :see_other
  end

  private
    def api_key_params
      params.expect(api_key: %i[name])
    end
end
