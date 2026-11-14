# ⚓ BeaconDock

[![CI](https://github.com/cmdr-chara/beacondock/actions/workflows/ci.yml/badge.svg)](https://github.com/cmdr-chara/beacondock/actions/workflows/ci.yml)
![Ruby 4.0](https://img.shields.io/badge/ruby-4.0-CC342D)
![Rails 8.1](https://img.shields.io/badge/rails-8.1-D30001)
![License](https://img.shields.io/badge/license-MIT-blue)

Self-hosted uptime monitoring — the **Rails sibling** of [PulseDock](https://github.com/cmdr-chara/pulsedock) (Go).
It periodically checks HTTP endpoints, records observations, opens/resolves
incidents, updates a live dashboard over Turbo Streams, and serves public
status pages plus a JSON REST API.

[English](#-english) · [Italiano](#-italiano)

---

## 🇬🇧 English

### Features

- **Monitor CRUD** — name, URL, GET/HEAD, interval (30s–1h), timeout (1–30s), expected HTTP status, degraded-latency threshold.
- **Check pipeline** — `ScheduleChecksJob` sweeps every 30s → one `CheckMonitorJob` per due monitor → `HttpCheckService` (bounded timeouts, ≤3 redirects, TLS verify) → `MonitorStatusService` persists the check, updates roll-up state, manages incidents, and broadcasts the card via Turbo/Solid Cable.
- **PulseDock-compatible status semantics** — `pending → up / down / degraded`. A failed or timed-out check is *never* a healthy observation. Incidents open only after **2 consecutive** `down` results (flap protection) and auto-resolve on recovery. `degraded` = up but slower than the per-monitor warn threshold (default 1500 ms).
- **Live dashboard** — dark status-page aesthetic, uptime % (24h/30d), latest latency, inline-SVG sparklines; cards update in real time.
- **Public status page** — `GET /status/:token`, one unguessable `status_page_token` per user. Only `public_on_status_page` monitors, **host only** (URLs may carry tokens), current status, 24h/30d uptime, last-14-day incidents.
- **REST API v1** — Bearer API keys (only digests stored), CRUD, paginated check history, status summary, uniform error envelope.
- **Bilingual UI** — English + Italian via `?locale=` (remembered in a cookie).
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
                                                      │ · broadcasts card   │
                                                      └──────────┬──────────┘
                                                                 ▼
                                            Turbo Streams (Solid Cable) → dashboard cards
```

Stack: Rails 8.1 · Ruby 4.0 · SQLite (primary/queue/cable) · Solid Queue +
Recurring · Solid Cable · Propshaft + importmap · Hotwire · RSpec.

### Local development

Prereqs: Ruby ≥ 3.4 (developed on Ruby 4.0 via RubyInstaller). No Docker or
Postgres needed — SQLite everywhere.

```bash
bin/setup            # bundle install + db:prepare (+ db:reset with --reset)
bin/rails db:seed    # demo data (optional but recommended)
bin/dev              # web (port 3000) + Solid Queue worker
```

`bin/dev` spawns `bin/rails server` and `bin/jobs` (see `Procfile.dev`).
On Windows the worker runs in `--mode async` automatically (no `fork(2)`).

**Demo credentials** (dev only): `demo@beacondock.dev` / `beacondock-demo`.
The seed prints the public status page URL and a demo API key.

### REST API

Auth: `Authorization: Bearer <api-key>` — create keys on the **API keys** page
(the plaintext token is shown once; only its SHA-256 digest is stored).
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
bundle exec rspec     # 129 examples: models, services (WebMock), jobs, requests, helpers
bin/rubocop           # rubocop-rails-omakase — clean
bin/brakeman          # 0 warnings
bin/ci                # setup + rubocop + bundler-audit + brakeman + rspec
```

HTTP checks are stubbed with WebMock — the suite never hits the network.
Broadcast assertions verify `Turbo::StreamsChannel.broadcast_replace_to` calls.

### Deployment

`Dockerfile`, `config/deploy.yml` (Kamal) and `bin/kamal` are stock Rails
artifacts for Linux container deploys — **untested on this Windows dev box**;
`bin/kamal` itself runs (a `fiddle` gem pin fixes a Ruby 4.0/Windows crash in
net-ssh/pageant). Recurring tasks need only `bin/jobs` running.

### Design notes

- The model class is **`SiteMonitor`** (table `monitors`): Ruby's stdlib
  `monitor` is loaded by ActiveSupport itself, so `::Monitor` must remain the
  stdlib class — connection pools, ActionCable and Zeitwerk call `Monitor.new`
  by name at runtime. `SiteMonitor.model_name` is pinned to `"Monitor"`, so all
  public contracts (routes, params, `monitor_id`, dom ids, i18n keys) are
  exactly as if it were named `Monitor`.
- `ScheduleChecksJob` pushes `next_check_at` forward *before* enqueueing, so
  overlapping sweeps cannot double-schedule a monitor.
- Error messages never embed exception text (URLs may carry secret tokens);
  `url`, `token`, `bearer`, `authorization` params are filtered from logs.

---

## 🇮🇹 Italiano

Monitoraggio uptime self-hosted — il **fratello Rails** di PulseDock (Go).
Controlla periodicamente endpoint HTTP, registra le osservazioni, apre/chiude
incidenti, aggiorna una dashboard live via Turbo Streams ed espone pagine di
stato pubbliche più una REST API JSON.

### Funzionalità

- **CRUD dei monitor** — nome, URL, GET/HEAD, intervallo (30s–1h), timeout (1–30s), stato HTTP atteso, soglia di latenza degradata.
- **Pipeline di controllo** — `ScheduleChecksJob` ogni 30s → un `CheckMonitorJob` per monitor dovuto → `HttpCheckService` (timeout limitati, ≤3 redirect, TLS) → `MonitorStatusService` persiste il check, aggiorna lo stato, gestisce gli incidenti e trasmette la card via Turbo/Solid Cable.
- **Semantica PulseDock** — `pending → up / down / degraded`. Un check fallito non è mai un'osservazione sana. Gli incidenti si aprono solo dopo **2 fallimenti consecutivi** (anti-flapping) e si risolvono al ripristino. `degraded` = risposta OK ma oltre la soglia di avviso (default 1500 ms).
- **Dashboard live** — tema scuro, uptime % (24h/30g), ultima latenza, sparkline SVG inline; le card si aggiornano in tempo reale.
- **Pagina di stato pubblica** — `GET /status/:token`, un token impredicibile per utente. Solo monitor pubblici, **solo host** (gli URL possono contenere token), stato attuale, uptime 24h/30g, incidenti degli ultimi 14 giorni.
- **REST API v1** — chiavi Bearer (solo il digest è salvato), CRUD, storico check paginato, riepilogo stato, envelope di errore uniforme.
- **UI bilingue** — Inglese + Italiano via `?locale=` (salvato in un cookie).
- **Retention** — i check oltre 30 giorni eliminati ogni notte (`PruneOldChecksJob` o `bin/rails checks:prune`).

### Sviluppo locale

Prerequisiti: Ruby ≥ 3.4 (sviluppato con Ruby 4.0 via RubyInstaller). Nessun
Docker né Postgres — solo SQLite.

```bash
bin/setup            # bundle install + db:prepare
bin/rails db:seed    # dati demo
bin/dev              # web (porta 3000) + worker Solid Queue
```

**Credenziali demo** (solo sviluppo): `demo@beacondock.dev` / `beacondock-demo`.

### API REST

Autenticazione: `Authorization: Bearer <chiave>` — le chiavi si creano nella
pagina **Chiavi API** (il token in chiaro è mostrato una sola volta).
Errori: `{ "error": { "code", "message" } }`.

```bash
curl -H "Authorization: Bearer bd_xxx" http://localhost:3000/api/v1/status
```

### Test e qualità

```bash
bundle exec rspec     # 129 esempi
bin/rubocop           # pulito
bin/brakeman          # 0 avvisi
bin/ci
```

### Deploy

`Dockerfile` e `config/deploy.yml` (Kamal) sono gli artifact standard di Rails
per deploy su container Linux — **non testati su questa macchina Windows**.

### Licenza

MIT — placeholder, vedi [LICENSE](LICENSE).
