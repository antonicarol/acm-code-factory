# PAGE-42-wishlist · result

- Status: VERIFIED
- Rounds: 2 (reports in `rounds/`)

## ⚠ Needs attention
- `Risk: medium`: new table and a contract between two repos.
- `attention: migration` — `api/src/migrations/1731000000000-wishlist.ts` (new table, reversible). Run `npm run migration:run` in `staging` before deploying `web`.
- Decision (default, unconfirmed): out-of-print editions stay visible, greyed out, in the wishlist.

## Per repo
### api (`api`, branch `PAGE-42-wishlist`)
- Changes: `src/migrations/1731000000000-wishlist.ts`, `src/wishlist/*` (module, controller, service, DTOs, tests)
- Verification: `npx tsc --noEmit` ok · `npm run lint` ok · `npm test` 412 passed · `npm run test:e2e` 38 passed
- PR: https://example.test/pagelight/api/pull/188

### web (`web`, branch `PAGE-42-wishlist`)
- Changes: `components/WishlistHeart.vue`, `pages/wishlist.vue`, `components/AppHeader.vue` (badge), `composables/useWishlist.ts`
- Verification: `pnpm exec nuxi typecheck` ok · `pnpm exec eslint .` ok · `pnpm test` 231 passed
- PR: https://example.test/pagelight/web/pull/313

## Adjustments
- Asked during the task: show the count badge also on mobile. Done in `AppHeader.vue`; verified at 390 px in the on-screen test.

## On-screen test
Environment: local. 
1. Add and remove from a catalogue card — reader — ✅
2. Wishlist page with an out-of-stock edition — reader — ✅
3. Limit of 200 reached — reader — ✅
(Screenshots are not included in this example.)

## Manual QA
1. As reader A, save two editions. Sign in as reader B in a private window. Expected: B's wishlist is empty and B's badge shows nothing.
2. As staff, mark a saved edition out of print. Expected: it stays in the reader's list, greyed out.

## Pending
- Price-drop alerts and sharing are out of scope; both are in `BACKLOG.md`.
