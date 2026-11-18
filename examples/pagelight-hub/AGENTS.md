# Pagelight workspace

The working hub for Pagelight, an online bookshop. Sessions start here: this file says **which repo a task goes to**; each repo has its own rules.

## Golden rule

Before reading or editing code in a repo, read its entry point (the "Docs" column) and follow its rules: stack, commands, branches, commits and tests belong to each repo, not to this hub. If something here contradicts the repo, the repo wins.

## Repos

The repos live inside the workspace (linked as `../<repo>`; each has its own git).

| Repo | What it is | Stack | Base branch · branches | Docs |
|---|---|---|---|---|
| `web` | The shop: catalogue, cart, checkout, account | Nuxt 3, TypeScript, pnpm | `main` · `PAGE-<n>-slug` | `AGENTS.md`, `docs/` |
| `api` | REST API behind `/api/*`: catalogue, orders, users, payments | NestJS, TypeScript, PostgreSQL, npm | `main` · `PAGE-<n>-slug` | `AGENTS.md`, `TESTING.md` |
| `infra` | AWS in Terraform: ECS services, RDS, CloudFront | Terraform | `main` · `feat/…`, `fix/…` | `README.md` |

## Where a task goes

- **Screens, components, copy** → `web`.
- **Endpoints, data, background jobs, migrations** → `api`.
- **Deploys, new services, domains, queues** → `infra` (and the service's repo).
- **Crosses front and back** (a new endpoint a screen consumes): one OpenSpec change with the contract in the proposal; one worker per repo builds each side at the same time. Example: [`PAGE-42-wishlist`](openspec/changes/PAGE-42-wishlist/proposal.md).
- If it is not clear, ask before touching anything.

How the pieces fit: [context/architecture.md](context/architecture.md). Product and vocabulary: [context/product.md](context/product.md), [context/glossary.md](context/glossary.md).

## Where things are kept

- `openspec/`: this hub is the OpenSpec store `pagelight` (schema `factory`: proposal → specs → tasks).
  - `openspec/changes/<task>/`: one task = one change (proposal with repos, branches and contract; specs; tasks per repo; `result.md`; `rounds/<N>/review.md`).
  - `openspec/specs/`: current requirements; they grow when each change is archived after the merge.
- `briefs/<task>/`: a light spec (`brief.md`) and its `result.md` when a task does not need a full change.
- `decisions/NNNN-*.md`: decisions that affect more than one repo or how we work.
- `testing/<repo>/TESTING.md`: environments, users per role and data for each repo. The tester reads them.
- `learnings/<repo>.md`, `learnings/workflow.md`: pitfalls and facts from retros, one dated line each.
- `context/`: stable knowledge (product, architecture, glossary).
- `panels/`: this hub's own Herdr panels. `trackers/`: its own task-tracker adapter.
- Anything that belongs to a single repo goes **in that repo**, not here.

## Tickets and git

- Tickets live in GitHub Issues of `pagelight/tracker` (adapter: `trackers/github-issues/`). `PAGE-<n>` in branch names and commits is the issue number.
- Each repo uses conventional commits.
- Every task gets a `.tasks/<task>/` folder with one folder per repo, prepared by `factory task-start`.

## Never

- Read `.env*`, `certs/` or credential files.
- Write to the production database or run `docker compose down -v` without being asked.
- Commit from the hub root: each repo is committed in its own git.
