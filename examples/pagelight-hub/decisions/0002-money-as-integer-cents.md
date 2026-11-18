# 0002 · Money as integer cents

- Status: accepted
- Date: 2026-09-30
- Affected repos: api, web

## Context
A rounding bug in the cart total came from adding floats (`0.1 + 0.2`).

## Decision
Prices and totals are integers in the smallest currency unit, in the database, the API and the web state. Formatting to `14.99` happens only when rendering.

## Consequences
Every price field is named `...Cents`. Reviewers reject new `number` price fields with decimals.
