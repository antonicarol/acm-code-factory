## 1. api

- [x] 1.1 Migration: `wishlist_items(reader_id, edition_id, added_at)` with unique `(reader_id, edition_id)` and index on `reader_id`
- [x] 1.2 `wishlist` module: `PUT`, `DELETE`, `GET` (cursor-paginated) and `GET /count`
- [x] 1.3 Enforce the 200-item cap with a `409` and a clear error code
- [x] 1.4 Unit tests per scenario; e2e test that reader A never sees reader B's items

## 2. web

- [x] 2.1 Heart button component with optimistic update and rollback on error
- [x] 2.2 Wishlist page with "load more" (cursor) and out-of-stock state
- [x] 2.3 Header count badge, refreshed when the list changes
- [x] 2.4 Signed-out reader clicking the heart is sent to sign-in and returned to the same page

## 3. Verification

- [x] 3.1 api: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run test:e2e`
- [x] 3.2 web: `pnpm exec nuxi typecheck`, `pnpm exec eslint .`, `pnpm test`
- [x] 3.3 On-screen test of the three flows (add, page, limit)
