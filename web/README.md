# BeaconDock console (web/)

A Next.js + Tailwind + MongoDB management console for the BeaconDock API.
The Rails app stays API + TUI only; this app is a separate process that reads
`/api/v1` server-side with a Bearer API key.

- **Next.js 16 / React 19 / TypeScript** — App Router, server components, route handlers
- **Tailwind CSS 4** — compiled to `public/assets/app.css` (`npm run css`) because
  Next 16's built-in CSS chunk serving is broken on this stack
- **MongoDB** — console preferences and alert rules only; domain data
  (monitors, checks, incidents) always comes from the Rails API. The console
  degrades gracefully when Mongo is unreachable.
- **design kit** — the copied design kit under `public/assets/`
  (graphite/safety-orange, Host Grotesk + JetBrains Mono). Do not edit kit files.

## Run

```bash
npm install
npm run css          # build public/assets/app.css (repeat after editing globals.css)
cp .env.example .env.local
# set BEACONDOCK_API_URL and BEACONDOCK_API_KEY (create a key via `rails console`)
npm run dev          # or: npm run build && npm start
```

### Environment

| Variable | Purpose |
| --- | --- |
| `BEACONDOCK_API_URL` | Rails API base, e.g. `http://localhost:3000` |
| `BEACONDOCK_API_KEY` | Bearer API key (`bd_...`) |
| `MONGODB_URI` | Optional. `npm run dev:mongo` starts a local in-memory MongoDB |
| `MONGODB_DB` | Optional, defaults to `beacondock_console` |

`compose.yml` provides a containerized MongoDB for setups with Docker.

## Verification

`npm run build` must pass. The visual finish gate checks the page in a real
browser (`CHROME_PATH` may need to point at a Chromium-family binary). Page data
is live: with the Rails API and a jobs worker running, the dashboard polls the
fleet every 15 s.
