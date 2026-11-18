APPROVE

Fix round. Both blocking findings from round 1 are fixed:

1. Cursor predicate now includes `reader_id`; `wishlist.service.spec.ts` has the two-readers-same-second case and fails without the fix.
2. `WishlistHeart.vue` rolls back on any non-2xx and shows the "list is full" message for `409`; covered by a new component test.

Optional (left to the author):
- `limit` is now capped at 100.

Gate lines:
- `attention: migration` — unchanged since round 1, still accepted.
