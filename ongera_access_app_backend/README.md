# Ongera Access App Backend

Starter **scaffold** for the [Ongera Access](Ongera_Access.md) backend — a Kinyarwanda-language stroke rehabilitation platform for patients in Rwanda.

> **Important:** The code in this repo is **sample / boilerplate only**. It shows how layers connect (HTTP → service → repository → DB). Real features — prescriptions, therapy sessions, progress reports, patient–doctor links — will be implemented later.

The mobile app is **Flutter** and **offline-first**. This backend will mainly handle auth, syncing clinical data, and serving doctors/caregivers — not the in-app therapy modules themselves.

---

## What this scaffold includes (samples)

| Sample | Purpose |
|--------|---------|
| `GET /health` | Shows the server and DB are reachable |
| `POST /api/v1/auth/login` | Example JWT login flow |
| `GET/POST /api/v1/users` | Example CRUD pattern (admin-only placeholder) |
| `users` table + sqlc queries | Example database layer |
| Auth middleware + `RequireRole()` | Example of protecting routes |

## What you will build later

| Domain feature | From product spec |
|----------------|-------------------|
| Patient registration | Email or phone signup |
| Doctor prescriptions | Clinical parameters for therapy |
| Therapy sessions & performance data | Ku Isoko, Subiramo, etc. |
| Progress & weekly reports | Patient view + caregiver/doctor view |
| Patient–clinician links | Consent-based data sharing (FR-SET-01) |

---

## User roles

| Role | Who |
|------|-----|
| `patient` | Post-stroke patient using the mobile app |
| `doctor` | Clinician who sets prescriptions |
| `caregiver` | Family member, nurse, or therapist |
| `admin` | Platform admin (rare) |

Permissions will eventually live in **services** (e.g. “can this doctor see this patient?”), not in route policy files.

---

## Architecture

```
HTTP request
    ↓
handlers/     ← parse HTTP, return JSON (no business rules)
    ↓
services/     ← business logic (real rules go here later)
    ↓
repository/   ← database access via sqlc
    ↓
PostgreSQL    ← pgx connection pool
```

**Sample request flow — login**

1. Client sends `POST /api/v1/auth/login` with username/password.
2. `UserHandler` validates the JSON body.
3. `UserService` checks credentials via the repository.
4. `auth.Service` compares the bcrypt hash and issues a JWT.
5. Client sends `Authorization: Bearer <token>` on later requests.
6. `middleware.Auth` validates the token; `RequireRole` checks the role when needed.

---

## Packages & tools

### Go modules (runtime)

| Package | What it does |
|---------|--------------|
| [`gin`](https://github.com/gin-gonic/gin) | HTTP web framework — routes, middleware, JSON responses. |
| [`pgx/v5`](https://github.com/jackc/pgx) | PostgreSQL driver and connection pool. |
| [`jwt/v5`](https://github.com/golang-jwt/jwt) | Creates and validates JWT login tokens. |
| [`godotenv`](https://github.com/joho/godotenv) | Loads variables from the `.env` file at startup. |
| [`golang.org/x/crypto`](https://pkg.go.dev/golang.org/x/crypto) | bcrypt password hashing for stored passwords. |
| [`log/slog`](https://pkg.go.dev/log/slog) | Standard library structured logging (used via `internal/logger`). |
| [`swaggo/gin-swagger`](https://github.com/swaggo/gin-swagger) + [`swaggo/files`](https://github.com/swaggo/files) | Serves the Swagger UI at `/swagger/index.html`. |

### Dev tools (install separately, not imported at runtime)

| Tool | What it does |
|------|--------------|
| [`sqlc`](https://sqlc.dev/) | Generates type-safe Go code from SQL in `db/sqlc/queries/`. |
| [`swag`](https://github.com/swaggo/swag) | Generates OpenAPI docs in `docs/` from handler comments. |
| [`migrate`](https://github.com/golang-migrate/migrate) | Applies versioned SQL files in `db/migrations/`. |

Install dev tools once:

```bash
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
go install github.com/swaggo/swag/cmd/swag@latest
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

---

## Internal packages

| Folder | What it does |
|--------|--------------|
| `cmd/server/` | Application entry — wires config, DB, routes. |
| `internal/config/` | Reads settings from `.env`. |
| `internal/logger/` | Configures `slog` (text or JSON). |
| `internal/database/` | Opens and pings the PostgreSQL pool. |
| `internal/auth/` | JWT issue/validate and bcrypt helpers. |
| `internal/middleware/` | Auth, role checks, and request logging. |
| `internal/handlers/` | HTTP layer — sample health and user endpoints. |
| `internal/services/` | Business logic layer — sample user service only. |
| `internal/repository/` | sqlc wrapper — sample user queries only. |
| `internal/models/` | Request/response structs and role constants. |
| `internal/repository/sqlc/` | **Generated** by sqlc — do not edit by hand. |
| `db/migrations/` | SQL schema changes for migrate. |
| `db/sqlc/queries/` | Hand-written SQL for sqlc to generate Go code. |
| `api/openapi.yaml` | Hand-written sample API contract (design reference). |
| `docs/` | **Generated** Swagger files from swag (served at `/swagger`). |

---

## Project layout

```
ongera_access_app_backend/
├── api/openapi.yaml         # sample API contract (not served at runtime)
├── cmd/server/main.go
├── db/
│   ├── migrations/          # schema versions
│   └── sqlc/queries/        # SQL for sqlc
├── docs/                    # generated Swagger (live UI)
├── internal/
│   ├── auth/
│   ├── config/
│   ├── database/
│   ├── handlers/
│   ├── logger/
│   ├── middleware/
│   ├── models/
│   ├── repository/
│   └── services/
├── .env.example
├── go.mod
├── sqlc.yaml
└── Ongera_Access.md         # full product context
```

---

## Setup

```bash
cp .env.example .env   # edit DB credentials if needed
go mod tidy
```

Create the database, then run migrations:

```bash
createdb ongera

migrate -path db/migrations \
  -database "postgres://$(whoami)@localhost:5432/ongera?sslmode=disable" up
```

Regenerate code after SQL or handler comment changes:

```bash
sqlc generate
swag init -g cmd/server/main.go -o docs --parseDependency --parseInternal
```

Start the server:

```bash
go run cmd/server/main.go
```

---

## Sample endpoints

These exist to **demonstrate patterns**, not as final product APIs.

| Method | Path | Access | Notes |
|--------|------|--------|-------|
| GET | `/health` | Public | DB ping check |
| GET | `/swagger/index.html` | Public | API docs browser |
| POST | `/api/v1/auth/login` | Public | Returns JWT |
| GET | `/api/v1/users` | Admin | Sample list — replace later |
| POST | `/api/v1/users` | Admin | Sample create — replace later |

### Try it

```bash
curl http://localhost:8080/health

curl -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"your-password"}'
```

---

## Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_NAME` | App name (logging) | Ongera Access App Backend |
| `APP_PORT` | HTTP port | `8080` |
| `APP_ENV` | Gin mode: `debug`, `release`, `test` | `debug` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `DB_NAME` | Database name | `ongera` |
| `DB_SSLMODE` | SSL mode | `disable` |
| `JWT_SECRET` | Token signing secret | `change-me` |
| `JWT_EXPIRY` | Token lifetime (e.g. `24h`) | `24h` |
| `JWT_ISSUER` | Token issuer claim | `ongera-access-app` |
| `LOG_LEVEL` | `debug`, `info`, `warn`, `error` | `info` |
| `LOG_FORMAT` | `text` or `json` | `text` |

---

## Where to start implementing

1. Replace sample `users` endpoints with **patient registration** (phone/email).
2. Add tables for **prescriptions**, **sessions**, **performance data**.
3. Add service-layer checks: `CanViewPatient(actor, patientID)`.
4. Add endpoints for **weekly reports** and **doctor prescription** input.
5. Keep the same layer pattern: handler → service → repository.

See `Ongera_Access.md` for full product context, modules, and clinical requirements.
