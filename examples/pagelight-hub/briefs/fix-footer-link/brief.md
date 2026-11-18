# fix-footer-link

## Why
The footer "Returns" link points to `/return` (404); the page is `/returns`.

## What changes
- `web`: fix the href in the footer component.

## Repos
| Repo | Branch | Base | What changes |
|---|---|---|---|
| web | PAGE-47-footer-returns | main | One href |

## Risk
- Risk: tiny — one string, no logic.
- Surfaces: ui

## Plan
1. Change `/return` to `/returns` in `components/AppFooter.vue`.
2. Add a unit test that every footer link resolves to an existing route.
