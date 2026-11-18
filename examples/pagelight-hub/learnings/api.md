# learnings · api

## general
- 2026-10-14 · pitfall · `npm test` needs Postgres up; without it the suite hangs 30 s then fails on a timeout, not a clear error · PAGE-31 · ana
- 2026-10-21 · fact · migrations run automatically on boot in `local` but not in `staging`; run `npm run migration:run` there · PAGE-36 · ana

## wishlist
- 2026-11-05 · pitfall · `DELETE /wishlist/:editionId` returns 204 even when the edition was not in the list (idempotent by design) · PAGE-42 · ana
