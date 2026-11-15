# BeaconDock agent instructions

## Identity and privacy

- Always commit as `cmdr-chara` using the GitHub noreply email configured in the repo-local git config. Never put a real name or personal email in commits, code, config, generated files, or documentation.
- Do not publish the owner's name or personal email anywhere in this repository.

## Architecture

- API-only Rails 8 app plus an interactive terminal UI — no HTML views, no sessions, no web authentication. Access happens through the JSON API (`/api/v1`, Bearer API key) or the TUI (`bin/beacondock`).
- `SiteMonitor` is intentionally named for the `monitors` table: Ruby's stdlib `Monitor` constant is already used by ActiveSupport. `SiteMonitor.model_name` is pinned to `"Monitor"` so table names, params (`monitor[...]`) and API contracts stay conventional.
- Checks run through Solid Queue (`bin/jobs`), scheduled per-monitor via `next_check_at`. `MonitorStatusService` owns incident open/resolve with anti-flapping (`FAILURE_THRESHOLD`); a failed or cancelled check must never become a healthy observation.
- `Check::RETENTION_PERIOD` is 30 days, pruned by `PruneOldChecksJob`.
- API errors use a single envelope: `{ "error": { "code", "message" } }`. API keys are stored as SHA-256 digests only.

## TUI

- Implementation lives in `lib/tui/dashboard.rb` (`Tui::Dashboard`), the binary is `bin/beacondock` (`--once` prints a single frame).
- Reuse monitor/check/incident semantics — the uptime bar uses the same "worst status per day" rule as `status_bars` previously did for the web.
- Emit ANSI only on a real TTY; restore the cursor on every exit path; redraw only changed lines.

## Verification

- `bundle exec rspec` for the suite, `bundle exec rubocop`, `bundle exec brakeman -q --no-pager`.
- Specs use factories and WebMock — never hit real network targets in tests.
- Smoke-test the TUI with `ruby bin/beacondock --once`.
