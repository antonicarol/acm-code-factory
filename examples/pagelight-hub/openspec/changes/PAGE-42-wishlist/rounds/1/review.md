CHANGES NEEDED

1. `api/src/wishlist/wishlist.service.ts:58` — the `GET` query filters by `reader_id` only after joining editions, so `nextCursor` can point to another reader's row when two readers saved the same edition at the same second — filter by `reader_id` in the cursor predicate and add a regression test with two readers.
2. `web/components/WishlistHeart.vue:31` — on a failed `PUT` the heart stays filled (the rollback runs only on a network error, not on a `4xx`) — roll back on any non-2xx response and show the error message for the `409` case.

Optional:
- `api/src/wishlist/wishlist.controller.ts:22` — the `limit` query param has no upper bound; cap it at 100 like the other list endpoints.

Gate lines:
- `attention: migration api/src/migrations/1731000000000-wishlist.ts` — accepted: new table only, reversible `down()`.
- `protected:` none touched.
