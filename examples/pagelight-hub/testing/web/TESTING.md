# Testing the web app

## Suites
- Unit: `pnpm test` (Vitest, no services needed).
- On-screen: the factory's `ui-tester` drives the app with Playwright against the local servers.

## Environment
`factory servers` starts `web` (`http://localhost:3000`) and `api` (`http://localhost:4000`). Postgres must be running (`docker compose up -d db` in `api/`).

## Users
| Role | Email | Password |
|---|---|---|
| Reader | `reader@example.test` | seed value in `api/.env.example` (`SEED_PASSWORD`) |
| Staff | `staff@example.test` | same |

## Data
`npm run seed` in `api/` creates 200 titles, the two users and an empty wishlist. Re-run it to reset.
