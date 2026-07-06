# Ongera Access — Admin Portal

React admin app for managing users, therapists, patients, and the therapy module catalog.

## Setup

```bash
npm install
cp .env.example .env   # if needed
npm run dev
```

Runs at **http://localhost:5175** with API requests proxied to the live backend.

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Production API base URL (`https://ongera-access-api.onrender.com`) |

In development the Vite proxy handles `/api` — no CORS setup required.

## Auth

Sign in with an **admin** account. Non-admin roles are rejected after login.

Without a configured API (non-dev build with no URL), demo credentials apply:

- **Email:** `admin@ongera.dev`
- **Password:** `AdminPass123!`

For the live API, create an admin user via Swagger (`POST /api/v1/users` with `role: admin`) or your database seed.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Dashboard counts |
| `/users` | List, create, delete users |
| `/therapists` | List profiles, verify therapists |
| `/patients` | List patients, assign verified therapists |
| `/catalog` | Modules → exercises → questions |

## Scripts

- `npm run dev` — development server (port 5175)
- `npm run build` — production build
- `npm run preview` — preview production build
