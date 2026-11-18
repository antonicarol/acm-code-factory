# Architecture

```
browser ──► CloudFront ──► web (Nuxt, SSR) ──► api (NestJS) ──► PostgreSQL
                                   │               └──► Stripe (payments)
                                   └── static assets (S3)
```

- **web** renders pages on the server and calls the API under `/api/*`. It has no database of its own.
- **api** is one NestJS service with modules (`catalog`, `orders`, `users`, `payments`, `wishlist`). Migrations live in `api/src/migrations/`.
- **infra** runs both as ECS services behind an ALB; PostgreSQL is RDS.
- Auth: the API issues a session cookie; `web` forwards it on server-side calls.
- Contracts: the API publishes OpenAPI at `/api/docs-json`; when an endpoint changes, the change's proposal states it in the **Contract** section.
