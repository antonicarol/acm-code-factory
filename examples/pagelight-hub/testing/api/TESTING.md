# Testing the API

## Suites
- Unit: `npm test` (Jest). Needs Postgres (`docker compose up -d db`).
- e2e: `npm run test:e2e`, against a throwaway database created per run.

## Data
`npm run seed` for local data. Tests create their own data under a random prefix and never delete rows they did not create.

## Pitfalls
See `learnings/api.md`.
