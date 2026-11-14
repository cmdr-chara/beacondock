FactoryBot.define do
  factory :check do
    monitor
    status { "up" }
    http_status { 200 }
    latency_ms { 123.4 }
    checked_at { Time.current }

    trait :down do
      status { "down" }
      http_status { 503 }
      latency_ms { nil }
      error { "Expected HTTP 200, got 503" }
    end

    trait :degraded do
      status { "degraded" }
      latency_ms { 2200.0 }
    end
  end
end
