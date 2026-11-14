FactoryBot.define do
  factory :monitor, class: "SiteMonitor" do
    user
    sequence(:name) { |n| "Monitor #{n}" }
    sequence(:url) { |n| "https://example#{n}.com/health" }
    http_method { "GET" }
    interval_seconds { 300 }
    timeout_seconds { 10 }
    expected_status { 200 }
    warn_latency_ms { 1500 }
    active { true }
    public_on_status_page { false }

    trait :public do
      public_on_status_page { true }
    end

    trait :inactive do
      active { false }
    end

    trait :due do
      next_check_at { 1.minute.ago }
    end
  end
end
