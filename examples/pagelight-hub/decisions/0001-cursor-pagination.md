# 0001 · Cursor pagination for list endpoints

- Status: accepted
- Date: 2026-09-12
- Affected repos: api, web

## Context
Offset pagination skipped or repeated items when the catalogue changed between pages, and got slow past page 500.

## Decision
New list endpoints take `?cursor=<opaque>&limit=<n>` and return `{ items, nextCursor }`. Existing offset endpoints keep working until they are touched.

## Consequences
Clients cannot jump to page N. `web` uses "load more". Tests must cover a page boundary with an insert in between.
