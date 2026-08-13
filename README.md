# Reel — Self-Hosted Movie Discovery & Seedr Client

A self-hosted, multi-user web app for discovering movies (TMDB), finding torrent releases via
a self-hosted Prowlarr instance, and sending them to Seedr for downloading. Every user
registers their own account and connects their own Seedr account — no shared credentials.

**Status: feature-complete.** Multi-user login, browsing/search, Prowlarr torrent search,
per-user Seedr connection + quota, and the Send-to-Seedr / Downloads flow are all implemented
and wired together.

## Tech stack

- **Frontend**: React + Vite + TypeScript, Tailwind CSS, React Router, TanStack Query, Axios
- **Backend**: Node.js + Express + TypeScript, Zod env validation, Pino logging
- **Caching**: Redis (falls back to an in-memory cache automatically if Redis isn't configured)
- **Sessions**: `express-session`, Redis-backed when `REDIS_URL` is set (falls back to
  in-memory for local dev)
- **Accounts**: bcrypt-hashed passwords, persisted to a JSON file under `backend/data/` by
  default, or Redis when `REDIS_URL` is set

The backend proxies every external API call and requires login for everything except
`/api/auth/{register,login,me}` and `/api/health`. No API key, session token, or Seedr
credential is ever exposed to the browser beyond the httpOnly session cookie.

## Project structure

```
backend/
  src/
    config/       env loading + validation (zod), session middleware factory
    utils/        logger, ApiError, asyncHandler, password hashing
    store/        UserStore abstraction (Redis / JSON file) for accounts + per-user Seedr tokens
    cache/        CacheService abstraction (Redis / in-memory) for TMDB/Prowlarr responses
    middleware/   error handler, 404 handler, requireAuth
    services/     TMDB, Prowlarr, Seedr, and app-auth clients
    controllers/  request handlers
    routes/       Express routers
frontend/
  src/
    components/   MovieCard, PosterGrid, TrendingRow, SearchBar, ErrorBoundary,
                   ConfirmDialog, ProtectedRoute, torrents/ (table, filters),
                   downloads/ (DownloadRow), layout/ (Header, QuotaBadge, UserMenu)
    layouts/      MainLayout (header + outlet)
    pages/        Login, Register, Home, Search, MovieDetail, Downloads, Profile, NotFound
    hooks/        React Query hooks (auth, movies, torrents, Seedr status/quota/tasks), useDebounce
    services/     apiClient (axios), movieService, torrentService, userAuthService,
                   authService (Seedr), quotaService, seedrTasksService, TMDB image URL helpers
    types/        shared TypeScript types
```

## Prerequisites

- Node.js 20+
- A [TMDB API key](https://www.themoviedb.org/settings/api) (v3 auth)
- A self-hosted [Prowlarr](https://prowlarr.com/) instance with at least one indexer enabled
  (optional — the app runs fine without it, torrent search just reports "not configured")
- A Seedr account (each user brings their own — see the Seedr section below)
- Docker + Docker Compose (optional, for containerized deployment)

## Local development setup

1. **Backend**

   ```bash
   cd backend
   cp .env.example .env
   # edit .env — at minimum set TMDB_API_KEY and SESSION_SECRET;
   # add PROWLARR_URL/PROWLARR_API_KEY when ready
   npm install
   npm run dev
   ```

   The API server starts on `http://localhost:4000`. Health check: `GET /api/health`.

2. **Frontend**

   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```

   The dev server starts on `http://localhost:5173` and proxies `/api/*` requests to the
   backend (see `vite.config.ts`), so no CORS configuration is needed in development beyond
   what's already set up.

3. Open `http://localhost:5173`, register an account, and log in. Every route past that
   point requires being logged in.

### Environment variables (backend/.env)

| Variable | Required | Description |
|---|---|---|
| `TMDB_API_KEY` | Yes | TMDB v3 API key |
| `SESSION_SECRET` | Yes | Random 16+ char string, used to sign the session cookie |
| `COOKIE_SECURE` | No | `true`/`false` (default `false`). Only set `true` if served over HTTPS — a `Secure` cookie is silently dropped by the browser over plain HTTP, which breaks login |
| `PORT` | No | Backend port (default `4000`) |
| `FRONTEND_URL` | No | Used for CORS origin (default `http://localhost:5173`) |
| `DATA_DIR` | No | Where user accounts are persisted when `REDIS_URL` isn't set (default `./data`) |
| `REDIS_URL` | No | If set, Redis is used for caching, sessions, and accounts; otherwise file/in-memory fallbacks are used |
| `CACHE_TTL_SECONDS` | No | TTL for TMDB response caching (default `21600` = 6h) |
| `PROWLARR_URL`, `PROWLARR_API_KEY` | No | Enables the "Torrent Availability" section on movie pages |

There is no Seedr configuration here — see below.

**No Seedr env vars, and that's intentional.** Seedr doesn't have a public OAuth
app-registration process for third-party developers (confirmed by reading Seedr's own
premium API docs and the open-source [seedrcc](https://github.com/hemantapkh/seedrcc)
client, which reverse-engineered the real endpoints from Seedr's Chrome extension). So
instead of a server-wide OAuth app, each user connects from their own Profile page
(`/profile`) with their own Seedr email and password. The backend calls Seedr's real,
undocumented password-grant endpoint once to get an access/refresh token pair, then never
touches the password again — only the tokens are stored, per-user, exactly like the OAuth
flow this replaced. See `backend/src/services/seedrService.ts` for the full details and
caveats (this is an unofficial API and could change without notice).

See `backend/.env.example` and `frontend/.env.example` for the full list.

## Docker Compose

```bash
cp backend/.env.example backend/.env
# edit backend/.env with your TMDB_API_KEY, SESSION_SECRET, and (optionally) Prowlarr credentials
docker compose up --build
```

- Frontend (nginx, static build + `/api` reverse proxy): `http://localhost:8080`
- Backend: `http://localhost:4000`
- Redis: internal only (caching + session + account store)

Prowlarr itself isn't bundled here — point `PROWLARR_URL` at whatever instance you already
run (its own indexer configuration is out of scope for this compose file). Mount a volume
over `backend/data` (or set `REDIS_URL`) if you want accounts to survive container rebuilds.

## Deploying on CasaOS / Orange Pi (or any ARM64 device)

Pre-built multi-arch images (`linux/amd64` + `linux/arm64`) are published automatically by
`.github/workflows/docker-publish.yml` on every push to `main`:

- [`siyamexcom/reel`](https://hub.docker.com/r/siyamexcom/reel) — **all-in-one**: backend +
  frontend (nginx) + Redis bundled into a single container. Simplest option, especially for
  CasaOS's single-container "Manual Install" form, which has no docker-compose import.
- [`siyamexcom/reel-backend`](https://hub.docker.com/r/siyamexcom/reel-backend) and
  [`siyamexcom/reel-frontend`](https://hub.docker.com/r/siyamexcom/reel-frontend) — separate
  images, for docker-compose or if you want to scale/restart each independently.

Docker automatically pulls the right architecture, so this works the same on an Orange Pi as
on any x86 machine — no cross-compiling on the device itself.

### Option A: single container (recommended for CasaOS)

One image, one port, no Redis/networking setup between containers. In CasaOS's "Manual App
Install" form:

| Field | Value |
|---|---|
| Docker Image | `siyamexcom/reel` |
| Tag | `latest` |
| Port | container `80` → host `8080` (or whatever's free) |
| Volume | container `/data` → a host path, e.g. `/DATA/AppData/reel` (persists Redis, which holds accounts/cache/sessions) |

Environment variables:
```
FRONTEND_URL=http://<your-device-ip>:8080
SESSION_SECRET=<a long random string>
TMDB_API_KEY=<your TMDB key>
PROWLARR_URL=http://<your-prowlarr-host>:9696
PROWLARR_API_KEY=<your Prowlarr key>
```

**If your platform's UI won't let two containers both claim container-port 80** (CasaOS does
this — it treats container-side ports as if they needed to be globally unique, which isn't
actually a Docker requirement): map to a different container port instead, e.g. `8080:8080`,
and add `HTTP_PORT=8080` to the environment variables so nginx inside the container actually
listens there too. The two values must match.

Equivalent plain `docker run`:

```bash
docker run -d --name reel --restart unless-stopped \
  -p 8080:80 \
  -v reel-data:/data \
  -e FRONTEND_URL=http://<your-device-ip>:8080 \
  -e SESSION_SECRET=<a long random string> \
  -e TMDB_API_KEY=<your TMDB key> \
  -e PROWLARR_URL=http://<your-prowlarr-host>:9696 \
  -e PROWLARR_API_KEY=<your Prowlarr key> \
  siyamexcom/reel:latest
```

### Option B: docker-compose (separate backend/frontend/redis containers)

```bash
cp backend.env.example backend.env
# edit backend.env — set FRONTEND_URL to how you'll actually reach this device
# (e.g. http://192.168.1.50:8080), SESSION_SECRET, TMDB_API_KEY, and Prowlarr details
docker compose -f docker-compose.casaos.yml up -d
```

### Option C: three separate CasaOS Manual Installs

If your CasaOS setup can't run docker-compose directly, `reel-backend`, `reel-frontend`, and
`redis:7-alpine` can each be installed as their own Manual App, addressing each other via
your device's LAN IP and published ports (`REDIS_URL=redis://<ip>:6379`,
`BACKEND_HOST=<ip>:4000` on the frontend). More moving parts than Option A for no real
benefit in a single-device home setup — only worth it if you specifically want independent
container lifecycles.

**Same CORS caveat in every option**: `FRONTEND_URL` must exactly match the URL you type into
your browser (protocol, host, and port), or the browser will block API requests as
cross-origin.

## Features

**Multi-user accounts**
- Open registration (username + password, bcrypt-hashed) — the whole app sits behind
  `ProtectedRoute` on the frontend and `requireAuth` on every backend route except
  register/login/me/health.
- Each user's Seedr connection is entirely their own: stored on their own account record,
  invisible to and unusable by any other user.
- A Profile page (`/profile`) shows account info and the Seedr connect/quota/disconnect UI.

**Discovery (TMDB)**
- Landing page with "Trending Today" / "Trending This Week" horizontal rows, a hero banner,
  hover animations, and skeleton loading states.
- Instant, debounced search with infinite scroll, reusing the shared poster grid.
- Movie detail page: backdrop, poster, metadata, genres, cast, production companies.
- All TMDB responses (trending, details, credits) are cached server-side for 6 hours; search
  results are cached briefly (15 min) since ranking changes more often.

**Torrent search (Prowlarr)**
- `prowlarrService` calls Prowlarr's aggregate search API (`GET /api/v1/search`), which fans
  a query out to every enabled indexer over Torznab and merges the results — more resilient
  than talking to each indexer's raw Torznab XML endpoint directly, since one flaky indexer
  can't break the whole search.
- Release names are parsed for resolution (2160p/1080p/720p/480p); results are cached for
  5 minutes and sorted by seeders descending by default.
- A sortable "Torrent Availability" table with resolution chips, a minimum-seeders slider,
  and release-name text filtering, all client-side over the fetched result set.
- Distinct, explanatory states for loading, Prowlarr not configured / unreachable / timed
  out, and "no releases found" — the table is never shown empty without an explanation.
- **Magnet-link fallback**: many releases only expose a Prowlarr download-proxy link, not a
  real `magnet:` URI. Rather than blocking those from being sent, the backend falls back to
  that link and, when sending to Seedr, fetches the actual `.torrent` file server-side and
  uploads it — so effectively every release with *any* usable link can be sent, not just the
  ones with a literal magnet.

**Seedr connection & quota**
- Each user connects with their own Seedr email/password from their Profile page. The
  backend exchanges that once for an access/refresh token pair via Seedr's real password
  grant, then discards the password — only tokens are ever stored, per-user.
- Automatic, transparent token refresh: proactively refreshes when the access token is near
  expiry, and if a Seedr call still comes back with an expired-token error, forces a refresh
  and retries the request exactly once before surfacing an error.
- Header shows a "Connect Seedr" link when disconnected, or a live storage quota bar
  (used / total) with a disconnect menu when connected.
- Seedr's real error messages (e.g. "Invalid username and password combination") are always
  surfaced to the user, never swallowed — verified live against Seedr's actual servers.

**Send to Seedr & Downloads**
- Each torrent row's "Send to Seedr" button is disabled when there's no usable link or Seedr
  isn't connected (with an explanatory tooltip), shows a spinner while in flight, and flips
  to a "Sent" state on success.
- A dedicated Downloads page polls Seedr every 10 seconds, showing a progress bar, status
  badge, size, download speed, and ETA per active torrent.
- Delete requires confirmation via a custom dialog. **There is no pause/resume** — Seedr's
  real API has no such operation (confirmed by inspecting the reverse-engineered client
  referenced above); only adding and deleting torrents are supported, so the UI doesn't
  offer buttons for something the API can't do.

## Error handling

Every backend route funnels errors through one handler that maps them to a consistent
`{ error, error_description }` JSON shape, which the frontend always surfaces to the user
(toast or inline message) rather than showing a blank or generic failure:

- Missing/invalid credentials for Prowlarr, or no Seedr connection yet, → a clear message
  instead of a crash or silent no-op.
- Upstream unreachable / DNS failure / timeout → distinguished, specific messages.
- Rate limiting (`429`) from an upstream API, or from this app's own API rate limiter → a
  dedicated "please wait a moment" message. Login/register specifically also have a tighter
  rate limit against brute-forcing.
- Expired/revoked Seedr tokens → transparent refresh-and-retry-once; only surfaced to the
  user if that retry also fails.
- Empty results (search, torrent availability, downloads) → an explanatory empty state, never
  a bare empty list.

## Known trade-offs

- **Seedr integration is unofficial.** There is no public Seedr API/OAuth documentation for
  third-party developers; the endpoints, client id, and request shapes used here were
  confirmed by reading an open-source reverse-engineered client and by testing directly
  against Seedr's live servers. This could break if Seedr changes their internal API.
- **No pause/resume for downloads** — not a missing feature, Seedr's real API doesn't expose
  one.
- **No list virtualization.** Search results and the torrent table are plain DOM lists. Fine
  at the scale TMDB/Prowlarr responses typically return; would need
  `@tanstack/react-virtual` or similar if that grows much further.
- **No automated test suite.** The app has been verified via typecheck, lint, production
  builds, and extensive manual/scripted browser testing (including against live TMDB,
  Prowlarr, and Seedr servers), but there are no unit/integration tests yet.
- **Prowlarr integration uses its aggregate `/api/v1/search` endpoint** rather than raw
  per-indexer Torznab XML — see the Prowlarr section above for the reasoning.
