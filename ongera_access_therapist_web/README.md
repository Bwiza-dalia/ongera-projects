# Ongera Access — Therapist Web

```bash
npm install
cp .env.example .env   # if you don't have .env yet
npm run dev
```

Runs on http://localhost:5173.

## API

Base URL: `https://ongera-access-api.onrender.com`

Swagger: https://ongera-access-api.onrender.com/swagger/index.html

**Local dev:** requests go to `/api/...` on `localhost:5173` and Vite proxies them to Render (the API does not allow browser CORS from localhost).

**Production build:** set in `.env`:

```bash
VITE_API_URL=https://ongera-access-api.onrender.com
```

Restart `npm run dev` after changing env or `vite.config.ts`.

Auth endpoints used by this app:

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/auth/login` | Log in (email + password) |
| POST | `/api/v1/auth/register` | Sign up (`role: therapist`) |
| GET | `/api/v1/auth/me` | Current user (Bearer token) |

Patients (live when API is configured):

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/patients` | Therapist's caseload |
| GET | `/api/v1/patients/{id}` | Patient profile |
| GET | `/api/v1/patients/{id}/progress` | Exercise progress (detail view) |

Modules (live when API is configured):

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/modules` | Module catalog (grouped by domain type) |
| GET | `/api/v1/modules/{id}` | Module with exercises |
| GET | `/api/v1/exercises/{id}` | Exercise levels (`question_counts`) |

Leave `VITE_API_URL` empty to use local mock auth instead.

## Layout

- `src/pages/Dashboard` — main screen
- `src/data/mockDashboard.ts` — fake data until more endpoints are wired
- `src/lib/apiClient.ts` — shared API fetch helper
- `src/styles/tokens.css` — colors (same palette as the Flutter app)

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run preview` — preview build

Backend repo: `ongera_access_app_backend`. Patient app: `ongera_access_app`.
