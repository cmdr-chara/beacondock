FactoryBot.define do
  factory :incident do
    monitor
    started_at { Time.current }
    cause { "Expected HTTP 200, got 503" }

    trait :resolved do
      resolved_at { 1.hour.from_now }
    end
  end
end
