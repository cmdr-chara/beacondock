namespace :checks do
  desc "Delete check observations older than Check::RETENTION_PERIOD (30 days)"
  task prune: :environment do
    deleted = Check.older_than_retention.delete_all
    puts "Pruned #{deleted} check(s) older than #{Check::RETENTION_PERIOD.inspect}"
  end
end
