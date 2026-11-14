Rails.application.routes.draw do
  resource :session
  resources :passwords, param: :token

  get "sign_up" => "registrations#new", as: :sign_up
  post "sign_up" => "registrations#create"

  resources :monitors, except: :index do
    member { post :check }
  end
  resources :api_keys, only: %i[index create destroy]

  # Public status page — one unguessable token per user, no auth required.
  get "status/:token" => "status_pages#show", as: :status_page

  namespace :api do
    namespace :v1 do
      resources :monitors, only: %i[index show create update destroy] do
        resources :checks, only: :index
      end
      get "status" => "status#show"
    end
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  root "dashboard#index"
end
