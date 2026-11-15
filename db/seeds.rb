# Demo data: `bin/rails db:seed`
#
# A realistic-looking fleet: 30 days of hourly check history per monitor,
# outage windows that produce matching incident records (so uptime bars and
# the event log show real variation), plus a mix of live targets so `bin/jobs`
# keeps producing fresh rows on top.

HISTORY_HOURS = 30 * 24 # one check per hour over 30 days

user = User.find_or_create_by!(email_address: "demo@beacondock.dev")

def seed_monitor(user, attrs)
  monitor = user.monitors.find_or_initialize_by(name: attrs[:name])
  monitor.assign_attributes(attrs)
  monitor.save!
  monitor
end

def check_row(monitor, at, outage, base_latency, now)
  base = { monitor_id: monitor.id, http_status: 200, checked_at: at,
           created_at: now, updated_at: now }
  if outage
    base.merge(status: Check.statuses.fetch("down"),
               http_status: outage[:http] || 503, latency_ms: nil,
               error: outage[:cause])
  else
    latency = base_latency * rand(0.7..1.6)
    latency *= rand(2.0..4.0) if rand < 0.06 # occasional spike
    base.merge(status: Check.statuses.fetch(latency >= monitor.warn_latency_ms ? "degraded" : "up"),
               latency_ms: latency.round(1), error: nil)
  end
end

def outage_cover?(outage, at, now)
  (outage[:from]..(outage[:to] || now)).cover?(at)
end

def seed_history(monitor, base_latency:, outages: [], now: Time.current)
  return if monitor.checks.any?

  rows = (HISTORY_HOURS - 1).downto(0).map do |hours_ago|
    at = now - hours_ago.hours
    outage = outages.find { |o| outage_cover?(o, at, now) }
    check_row(monitor, at, outage, base_latency, now)
  end
  Check.insert_all(rows)

  outages.each do |o|
    monitor.incidents.find_or_create_by!(started_at: o[:from]) do |incident|
      incident.resolved_at = o[:to]
      incident.cause = o[:cause]
    end
  end

  statuses = monitor.checks.limit(10).pluck(:status)
  monitor.update_columns(
    last_status: statuses.first || "pending",
    last_checked_at: monitor.checks.first&.checked_at,
    consecutive_failures: statuses.take_while { |s| s == "down" }.count,
    next_check_at: now + monitor.interval_seconds
  )
end

h = ->(hours) { hours.hours.ago }
m = ->(minutes) { minutes.minutes.ago }

seed_history(
  seed_monitor(user, name: "github.com", url: "https://github.com",
                     interval_seconds: 60, warn_latency_ms: 800),
  base_latency: 90,
  outages: [
    { from: h.call(6 * 24 + 3), to: h.call(6 * 24 + 2), cause: "Expected HTTP 200, got 503" }
  ]
)
seed_history(
  seed_monitor(user, name: "api.github.com", url: "https://api.github.com",
                     interval_seconds: 60, warn_latency_ms: 800),
  base_latency: 120,
  outages: [
    { from: h.call(15 * 24 + 8), to: h.call(15 * 24 + 7), cause: "Request timed out" }
  ]
)
seed_history(
  seed_monitor(user, name: "status.stripe.com", url: "https://status.stripe.com",
                     interval_seconds: 120, warn_latency_ms: 900),
  base_latency: 150,
  outages: [
    { from: h.call(9 * 24 + 11), to: h.call(9 * 24 + 10), cause: "Expected HTTP 200, got 502" }
  ]
)
seed_history(
  seed_monitor(user, name: "example.com", url: "https://example.com",
                     interval_seconds: 300),
  base_latency: 70
)
seed_history(
  seed_monitor(user, name: "internal: app /up", url: "http://localhost:3000/up",
                     interval_seconds: 60, warn_latency_ms: 250),
  base_latency: 60,
  outages: [
    { from: h.call(26), to: h.call(24), cause: "Request timed out" },
    { from: h.call(14 * 24 + 5), to: h.call(14 * 24 + 1), cause: "Expected HTTP 200, got 500" },
    { from: h.call(21 * 24 + 2), to: h.call(21 * 24), cause: "Expected HTTP 200, got 503" }
  ]
)

# Always-down target: port 9999 refuses connections, so live checks keep
# producing real failures and the open incident below stays red.
down_monitor = seed_monitor(user, name: "staging: billing",
                                url: "http://127.0.0.1:9999/health", interval_seconds: 60)
seed_history(down_monitor, base_latency: 25,
  outages: [ { from: m.call(90), to: nil, cause: "Connection refused" } ])

# Never-checked monitor: shows the pending state in the dashboard and TUI.
seed_monitor(user, name: "docs (pending)", url: "https://example.org",
                   interval_seconds: 600, active: false)

if user.api_keys.none?
  key = user.api_keys.create!(name: "demo-cli")
  puts "Demo API key (shown once): #{key.raw_token}"
end

puts "Seeded demo user: #{user.email_address}"
