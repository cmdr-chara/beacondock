# ⚓ BeaconDock

[![CI](https://github.com/cmdr-chara/beacondock/actions/workflows/ci.yml/badge.svg)](https://github.com/cmdr-chara/beacondock/actions/workflows/ci.yml)
![Ruby 4.0](https://img.shields.io/badge/ruby-4.0-CC342D)
![Rails 8.1](https://img.shields.io/badge/rails-8.1-D30001)
![License](https://img.shields.io/badge/license-MIT-blue)

Self-hosted uptime monitoring — the **Rails sibling** of [PulseDock](https://github.com/cmdr-chara/pulsedock) (Go).
It periodically checks HTTP endpoints, records observations and opens/resolves
incidents. There is **no web UI**: you drive it through the JSON REST API or the
interactive terminal dashboard (`bin/beacondock`).

[English](#-english) · [Italiano](#-italiano)

---

## 🇬🇧 English

### Features

- **Monitor CRUD** — name, URL, GET/HEAD, interval (30s–1h), timeout (1–30s), expected HTTP status, degraded-latency threshold.
- **Check pipeline** — `ScheduleChecksJob` sweeps every 30s → one `CheckMonitorJob` per due monitor → `HttpCheckService` (bounded timeouts, ≤3 redirects, TLS verify) → `MonitorStatusService` persists the check, updates roll-up state, manages incidents.
- **PulseDock-compatible status semantics** — `pending → up / down / degraded`. A failed or timed-out check is *never* a healthy observation. Incidents open only after **2 consecutive** `down` results (flap protection) and auto-resolve on recovery. `degraded` = up but slower than the per-monitor warn threshold (default 1500 ms).
- **Interactive TUI** — boxed ratatui-style dashboard: severity-sorted monitor table, per-monitor next-check countdown, 30-day uptime strip, incident log; arrow keys + Enter open a detail view with latency stats and recent checks.
- **REST API v1** — Bearer API keys (only SHA-256 digests stored), CRUD, paginated check history, status summary, uniform error envelope.
- **Retention** — checks older than 30 days pruned daily (`PruneOldChecksJob`, or `bin/rails checks:prune`).

### Architecture

```
┌────────────────┐   every 30s    ┌──────────────────┐  one job per due   ┌─────────────────┐
│ recurring.yml  │──────────────▶ │ ScheduleChecksJob│─────────────────▶│ CheckMonitorJob │
└────────────────┘                └──────────────────┘   monitor        └────────┬────────┘
                                                                                 │
                                          ┌──────────────────────────────────────┤
                                          ▼                                      │
                              ┌────────────────────┐   Check row + status roll-up│
                              │  HttpCheckService  │──────────┐                  │
                              │ (net/http, TLS,    │          ▼                  │
                              │  ≤3 redirects,     │  ┌─────────────────────┐    │
                              │  bounded timeouts) │  │ MonitorStatusService│    │
                              └────────────────────┘  │ · creates Check     │◄───┘
                                                      │ · updates Monitor   │
                                                      │ · opens/resolves    │
                                                      │   Incident (≥2 downs)│
                                                      └─────────────────────┘
┌───────────────┐                                  ┌──────────────┐
│ REST API (:3000/api/v1)        same SQLite DB    │ TUI (bin/beacondock) │
└───────────────┘                                  └──────────────┘
```

Stack: Rails 8.1 (API-only) · Ruby 4.0 · SQLite (primary + Solid Queue/Cache) ·
RSpec · `pastel`/`tty-screen`/`tty-reader` for the TUI.

### Local development

Prereqs: Ruby ≥ 3.4 (developed on Ruby 4.0 via RubyInstaller). No Docker or
Postgres needed — SQLite everywhere.

```bash
bin/setup            # bundle install + db:prepare (+ db:reset with --reset)
bin/rails db:seed    # demo fleet + prints a demo API key
bin/dev              # API server (port 3000) + Solid Queue worker
```

`bin/dev` spawns `bin/rails server` and `bin/jobs` (see `Procfile.dev`).
On Windows the worker runs in `--mode async` automatically (no `fork(2)`).

There is no browser UI — `bin/rails server` only serves `/api/v1/*` and the `/up`
health check. Create extra API keys from the console:

```bash
bin/rails runner 'puts User.first.api_keys.create!(name: "laptop").raw_token'
```

### Terminal UI

`bin/beacondock` opens the live monitoring dashboard in your shell — the same
database the workers write, refreshed every 5 s.

```bash
ruby bin/beacondock          # live, interactive
ruby bin/beacondock --once   # single frame (pipes, screenshots)
```

```
┌─ beacondock  7 monitors ──────────────────────────────── 12:45:10 ┐
│ 1 incident open · next check now                                  │
├ monitors ─────────────────────────────────────────────────────────┤
│   monitor            method every next  status    latency uptime     30d │
│ ▸ staging: billing   GET    1m    now   ✕ down         —  ▇▇▇▇▇▇▇▇▇x 99.72%│
│   api.github.com     GET    1m    now   ● up       163 ms ▇▇▇▇▇▇▇▇▇▇ 99.86%│
│   github.com         GET    1m    now   ● up       112 ms ▇▇▇x▇▇▇▇▇▇ 99.86%│
│   internal: app /up  GET    1m    now   ● up        80 ms ▁▁▇▇▇▇▁▇x▇ 98.89%│
│   docs (pending)     GET    10m   —     ◌ pending      —  ··········     —│
├ recent events ────────────────────────────────────────────────────┤
│ ▲ 11:11 staging: billing — Connection refused                       │
│ ✓ 14 Nov internal: app /up — resolved after 2h 0m                   │
└ ↑↓ select · enter detail · r refresh · q quit · live every 5 s ────┘
```

Keys: `↑`/`↓` or `j`/`k` select a monitor, `Enter` opens the detail view
(status, avg/p95/max latency, wide sparkline, uptime 24h/7d/30d, recent
checks), `Esc`/`h` goes back, `r` refreshes, `q` quits.

The uptime bar is the worst check status per day (up `▇`, degraded `▁`, down
`x`, no data `·`). Monitors sort by severity — problems float to the top.
Rendering is diff-only (no flicker), ANSI is emitted on real TTYs only, and
Windows scan codes are handled alongside ANSI arrows. Renderer lives in
`lib/tui/dashboard.rb`.

### REST API

Auth: `Authorization: Bearer <api-key>` — `bin/rails db:seed` prints a demo
key (the plaintext token is shown once; only its SHA-256 digest is stored).
Failures use `{ "error": { "code", "message" } }`; collections use `{ "data": [...] }`.

| Endpoint | Description |
|---|---|
| `GET /api/v1/status` | counts by status + open incidents |
| `GET /api/v1/monitors` | list monitors |
| `POST /api/v1/monitors` | create |
| `GET /api/v1/monitors/:id` | show |
| `PATCH /api/v1/monitors/:id` | update |
| `DELETE /api/v1/monitors/:id` | delete (204) |
| `GET /api/v1/monitors/:id/checks?page=&per_page=` | check history (max 100/page) |

```bash
curl -H "Authorization: Bearer bd_xxx" http://localhost:3000/api/v1/status
curl -X POST http://localhost:3000/api/v1/monitors \
  -H "Authorization: Bearer bd_xxx" -H "Content-Type: application/json" \
  -d '{"monitor": {"name": "Site", "url": "https://example.com", "interval_seconds": 60}}'
```

### Testing & quality

```bash
bundle exec rspec     # 99 examples: models, services (WebMock), jobs, API, TUI
bin/rubocop           # rubocop-rails-omakase — clean
bin/brakeman          # 0 warnings
bin/ci                # setup + rubocop + bundler-audit + brakeman + rspec
```

HTTP checks are stubbed with WebMock — the suite never hits the network.

### Deployment

`Dockerfile`, `config/deploy.yml` (Kamal) and `bin/kamal` are stock Rails
artifacts for Linux container deploys — **untested on this Windows dev box**;
`bin/kamal` itself runs (a `fiddle` gem pin fixes a Ruby 4.0/Windows crash in
net-ssh/pageant). Recurring tasks need only `bin/jobs` running.

### Design notes

- The model class is **`SiteMonitor`** (table `monitors`): Ruby's stdlib
  `monitor` is loaded by ActiveSupport itself, so `::Monitor` must remain the
  stdlib class. `SiteMonitor.model_name` is pinned to `"Monitor"`, so public
  contracts (params `monitor[...]`, `monitor_id`) stay conventional.
- `ScheduleChecksJob` pushes `next_check_at` forward *before* enqueueing, so
  overlapping sweeps cannot double-schedule a monitor.
- Error messages never embed exception text (URLs may carry secret tokens);
  `url`, `token`, `bearer`, `authorization` params are filtered from logs.

---

## 🇮🇹 Italiano

Monitoraggio uptime self-hosted — il **fratello Rails** di PulseDock (Go).
Controlla periodicamente endpoint HTTP, registra le osservazioni e apre/chiude
incidenti. **Nessuna UI web**: lo piloti tramite la REST API JSON o la
dashboard interattiva da terminale (`bin/beacondock`).

### Funzionalità

- **CRUD dei monitor** — nome, URL, GET/HEAD, intervallo (30s–1h), timeout (1–30s), stato HTTP atteso, soglia di latenza degradata.
- **Pipeline di controllo** — `ScheduleChecksJob` ogni 30s → un `CheckMonitorJob` per monitor dovuto → `HttpCheckService` (timeout limitati, ≤3 redirect, TLS) → `MonitorStatusService` persiste il check e gestisce gli incidenti.
- **Semantica PulseDock** — `pending → up / down / degraded`. Un check fallito non è mai un'osservazione sana. Gli incidenti si aprono solo dopo **2 fallimenti consecutivi** (anti-flapping) e si risolvono al ripristino.
- **TUI interattiva** — dashboard incorniciata stile ratatui: tabella ordinata per severità, countdown per-monitor, striscia uptime 30 giorni, log incidenti; frecce + Invio aprono il dettaglio con statistiche di latenza e ultimi check.
- **REST API v1** — chiavi Bearer (solo il digest SHA-256 è salvato), CRUD, storico check paginato, riepilogo stato, envelope di errore uniforme.
- **Retention** — i check oltre 30 giorni eliminati ogni notte (`PruneOldChecksJob` o `bin/rails checks:prune`).

### Sviluppo locale

Prerequisiti: Ruby ≥ 3.4 (sviluppato con Ruby 4.0 via RubyInstaller). Nessun
Docker né Postgres — solo SQLite.

```bash
bin/setup            # bundle install + db:prepare
bin/rails db:seed    # flotta demo + chiave API stampata a schermo
bin/dev              # server API (porta 3000) + worker Solid Queue
```

Niente interfaccia browser — il server espone solo `/api/v1/*` e l'health
check `/up`. Chiavi API extra dalla console:

```bash
bin/rails runner 'puts User.first.api_keys.create!(name: "laptop").raw_token'
```

### Interfaccia a terminale (TUI)

`bin/beacondock` apre la dashboard live nella shell — lo stesso database che
scrivono i worker, aggiornato ogni 5 s.

```bash
ruby bin/beacondock          # live, interattiva
ruby bin/beacondock --once   # un solo frame (pipe, screenshot)
```

Tasti: `↑`/`↓` o `j`/`k` selezionano un monitor, `Invio` apre il dettaglio,
`Esc`/`h` torna indietro, `r` aggiorna, `q` esce. La barra uptime è il peggior
stato del giorno (up `▇`, degradato `▁`, down `x`, nessun dato `·`); i problemi
risalgono in cima alla tabella.

### API REST

Autenticazione: `Authorization: Bearer <chiave>` — `bin/rails db:seed` stampa
una chiave demo (il token in chiaro è mostrato una sola volta).
Errori: `{ "error": { "code", "message" } }`.

```bash
curl -H "Authorization: Bearer bd_xxx" http://localhost:3000/api/v1/status
```

### Test e qualità

```bash
bundle exec rspec     # 99 esempi
bin/rubocop           # pulito
bin/brakeman          # 0 avvisi
bin/ci
```

### Deploy

`Dockerfile` e `config/deploy.yml` (Kamal) sono gli artifact standard di Rails
per deploy su container Linux — **non testati su questa macchina Windows**.

### Licenza

MIT — placeholder, vedi [LICENSE](LICENSE).
