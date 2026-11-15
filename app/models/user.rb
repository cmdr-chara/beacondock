class User < ApplicationRecord
  has_many :monitors, class_name: "SiteMonitor", dependent: :destroy, inverse_of: :user
  has_many :api_keys, dependent: :destroy

  normalizes :email_address, with: ->(e) { e.strip.downcase }

  validates :email_address, presence: true, uniqueness: true,
    format: { with: URI::MailTo::EMAIL_REGEXP }
end
