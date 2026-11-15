require "rails_helper"

RSpec.describe "Monitors", type: :request do
  let(:user) { create(:user) }
  let!(:monitor) { create(:monitor, user: user) }

  before { sign_in(user) }

  let(:valid_params) do
    { monitor: {
      name: "New site", url: "https://new.example.com/health", http_method: "GET",
      interval_seconds: 60, timeout_seconds: 10, expected_status: 200,
      warn_latency_ms: 1500, active: true, public_on_status_page: false
    } }
  end

  describe "GET /monitors/:id" do
    it "shows details, checks and incidents" do
      create(:check, monitor: monitor)
      create(:incident, monitor: monitor)

      get monitor_path(monitor)

      expect(response).to have_http_status(:ok)
      expect(response.body).to include(monitor.name)
      expect(response.body).to include("Recent checks")
      expect(response.body).to include("Incidents")
    end

    it "404s on another user's monitor" do
      other = create(:monitor, user: create(:user))
      get monitor_path(other)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /monitors" do
    it "creates a monitor" do
      expect { post monitors_path, params: valid_params }
        .to change(user.monitors, :count).by(1)
      expect(response).to redirect_to(monitor_path(SiteMonitor.last))
    end

    it "re-renders the form on validation errors" do
      post monitors_path, params: { monitor: valid_params[:monitor].merge(url: "bad-url") }
      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.body).to include("form-errors")
    end
  end

  describe "PATCH /monitors/:id" do
    it "updates the monitor" do
      patch monitor_path(monitor), params: { monitor: { name: "Renamed" } }
      expect(response).to redirect_to(monitor_path(monitor))
      expect(monitor.reload.name).to eq("Renamed")
    end

    it "cannot update another user's monitor" do
      other = create(:monitor, user: create(:user))
      patch monitor_path(other), params: { monitor: { name: "hax" } }
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "DELETE /monitors/:id" do
    it "destroys the monitor and its checks" do
      create(:check, monitor: monitor)
      expect { delete monitor_path(monitor) }
        .to change(user.monitors, :count).by(-1)
        .and change(Check, :count).by(-1)
      expect(response).to redirect_to(dashboard_path)
    end
  end

  describe "POST /monitors/:id/check" do
    it "enqueues a check for an active monitor" do
      expect { post check_monitor_path(monitor) }
        .to have_enqueued_job(CheckMonitorJob).with(monitor.id)
      expect(response).to redirect_to(monitor_path(monitor))
    end

    it "does not enqueue a check for a paused monitor" do
      monitor.update!(active: false)
      expect { post check_monitor_path(monitor) }
        .not_to have_enqueued_job(CheckMonitorJob)
      expect(response).to redirect_to(monitor_path(monitor))
    end

    it "cannot check another user's monitor" do
      other = create(:monitor, user: create(:user))
      post check_monitor_path(other)
      expect(response).to have_http_status(:not_found)
    end
  end

  it "requires authentication" do
    delete session_path
    get new_monitor_path
    expect(response).to redirect_to(new_session_path)
  end
end
