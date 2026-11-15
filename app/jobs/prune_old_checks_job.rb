# Deletes Check rows older than Check::RETENTION_PERIOD (30 days) so the
# observations table stays bounded. Runs daily via config/recurring.yml and
# can also be triggered manually with `bin/rails checks:prune`.
class PruneOldChecksJob < ApplicationJob
  queue_as :default

  def perform
    Check.older_than_retention.in_batches(of: 1_000, &:delete_all)
  end
end
