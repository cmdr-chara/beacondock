FactoryBot.define do
  factory :api_key do
    user
    sequence(:name) { |n| "key-#{n}" }
  end
end
