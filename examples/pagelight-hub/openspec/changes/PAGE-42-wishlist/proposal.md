## Why

Readers want to save books they are not ready to buy. Support gets weekly emails asking for "a save for later". A private wishlist also gives merchandising a signal of demand.

## What Changes

- A heart button on every edition (catalogue card and edition page) adds or removes it from the reader's wishlist.
- A new "Wishlist" page lists saved editions with price, stock and an "Add to cart" button.
- The header shows a count badge of saved editions.

## Repos

| Repo | Branch | Base | What changes |
|---|---|---|---|
| api | PAGE-42-wishlist | main | `wishlist` module: table, three endpoints, migration |
| web | PAGE-42-wishlist | main | Heart button, wishlist page, header badge |

## Risk

- Risk: medium — new table and migration, two repos, a contract between them.
- Surfaces: ui, security (a reader must only see their own list)

## Contract

All under `/api/wishlist`, session cookie required (401 without it). Prices are integer cents (decisions/0002).

| Method + path | Request | Response |
|---|---|---|
| `GET /api/wishlist?cursor=&limit=` | — | `200 { items: [{ editionId, titleName, formatName, priceCents, inStock, addedAt }], nextCursor }` (decisions/0001) |
| `PUT /api/wishlist/:editionId` | — | `204`; `404` if the edition does not exist; `409` if the list already has 200 editions |
| `DELETE /api/wishlist/:editionId` | — | `204` (also when it was not in the list) |
| `GET /api/wishlist/count` | — | `200 { count }` |

## Capabilities

### New Capabilities
- `wishlist`: a reader's private list of editions saved for later.

### Modified Capabilities
- None.

## Decisions / Out of scope

- Decision: the list is capped at 200 editions to bound the query.
- Decision (default, unconfirmed): removing an edition that is out of print keeps it visible, greyed out, so a reader can see what disappeared.
- Out of scope: sharing a wishlist, email alerts when a price drops.
- Manual QA: with two readers, check that one cannot see the other's list.
