class ApiKey < ApplicationRecord
  TOKEN_PREFIX = "bd_"
  # Throttle last_used_at writes so a busy key does not write on every request.
  LAST_USED_WRITE_INTERVAL = 1.minute

  belongs_to :user

  attr_reader :raw_token

  validates :name, presence: true, length: { maximum: 80 }
  validates :token_digest, presence: true, uniqueness: true

  before_validation :generate_token, on: :create

  scope :usable, -> { where(revoked_at: nil) }

  # Looks up a usable key by its plaintext token. Tokens are only ever stored
  # as SHA-256 digests — the plaintext is shown once at creation time.
  def self.authenticate(raw_token)
    return if raw_token.blank?

    key = usable.find_by(token_digest: digest(raw_token))
    key&.touch_last_used!
    key
  end

  def self.digest(raw_token)
    Digest::SHA256.hexdigest(raw_token)
  end

  def revoked?
    revoked_at.present?
  end

  def revoke!
    update!(revoked_at: Time.current)
  end

  def touch_last_used!
    return if last_used_at&.> LAST_USED_WRITE_INTERVAL.ago

    update_column(:last_used_at, Time.current) # rubocop:disable Rails/SkipsModelValidations
  end

  def masked_token
    "#{token_prefix}#{"•" * 8}"
  end

  private
    def generate_token
      @raw_token = "#{TOKEN_PREFIX}#{SecureRandom.urlsafe_base64(32)}"
      self.token_digest = self.class.digest(@raw_token)
      self.token_prefix = @raw_token.first(12)
    end
end
