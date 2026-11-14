# Demo data: `bin/rails db:seed`
# Creates a demo user (dev only — see README) plus a handful of monitors with
# fabricated 24h check history and one incident so the dashboard isn't empty.

demo_password = ENV.fetch("SEED_DEMO_PASSWORD", "beacondock-demo")
user = User.find_or_initialize_by(email_address: "demo@beacondock.dev")
user.password = demo_password
user.password_confirmation = demo_password
user.save!
user.regenerate_status_page_token if user.status_page_token.blank?

def seed_monitor(user, attrs, check_pattern:)
  monitor = user.monitors.find_or_initialize_by(name: attrs[:name])
  monitor.assign_attributes(attrs)
  monitor.save!

  if monitor.checks.none?
    now = Time.current
    # Fabricate ~24h of history at ~30min granularity.
    check_pattern.each_with_index do |status, i|
      latency = status == "down" ? nil : rand(80.0..420.0).round(1)
      monitor.checks.create!(
        status: status,
        http_status: status == "down" ? [ 500, 503 ].sample : 200,
        latency_ms: latency,
        error: status == "down" ? "Expected HTTP 200, got 503" : nil,
        checked_at: now - (check_pattern.size - i) * 30.minutes
      )
    end

    if check_pattern.any?
      last = check_pattern.last
      failures = check_pattern.reverse.take_while { |s| s == "down" }.count
      monitor.update!(
        last_status: last,
        last_checked_at: now - 30.minutes,
        consecutive_failures: failures,
        next_check_at: now + monitor.interval_seconds.seconds
      )
    end
  end

  monitor
end

mostly_up = Array.new(46, "up") + [ "down", "down" ]
mixed = Array.new(40, "up") + [ "degraded" ] * 4 + [ "up" ] * 4
flaky = Array.new(20, "up") + [ "down" ] * 3 + Array.new(22, "up") + [ "down" ] * 3

m1 = seed_monitor(user, { name: "GitHub", url: "https://github.com", interval_seconds: 60, public_on_status_page: true }, check_pattern: mostly_up)
m2 = seed_monitor(user, { name: "Example.com", url: "https://example.com", interval_seconds: 300, public_on_status_page: true }, check_pattern: Array.new(48, "up"))
seed_monitor(user, { name: "JSONPlaceholder API", url: "https://jsonplaceholder.typicode.com/posts/1", interval_seconds: 120, public_on_status_page: true }, check_pattern: mixed)
m4 = seed_monitor(user, { name: "Internal health endpoint", url: "http://localhost:3000/up", interval_seconds: 60 }, check_pattern: flaky)
seed_monitor(user, { name: "Pending monitor", url: "https://example.org", interval_seconds: 600 }, check_pattern: [])

if m1.incidents.none?
  m1.incidents.create!(started_at: 20.hours.ago, resolved_at: 19.hours.ago, cause: "Expected HTTP 200, got 503")
  m4.incidents.create!(started_at: 3.hours.ago, resolved_at: 2.5.hours.ago, cause: "Request timed out")
end

if user.api_keys.none?
  key = user.api_keys.create!(name: "demo-cli")
  puts "Demo API key (shown once): #{key.raw_token}"
end

puts "Seeded demo user: demo@beacondock.dev / #{demo_password}"
puts "Status page: /status/#{user.status_page_token}"
