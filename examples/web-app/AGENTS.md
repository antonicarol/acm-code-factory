# My product workspace

The working hub for the product. Sessions start here: this file says **which repo a task goes to**; each repo has its own rules.

## Golden rule

Before reading or editing code in a repo, read its entry point (the "Docs" column below) and follow its rules: stack, commands, branches, commits and tests belong to each repo, not to this hub. If something here contradicts the repo, the repo wins.

## Repos

The repos live inside the workspace (linked as `../<repo>`; each has its own git).

| Repo | What it is | Stack | Base branch · branches | Docs |
|---|---|---|---|---|
| `web` | The customer-facing frontend | TypeScript, pnpm | `main` · `PROJ-<n>-slug` | `AGENTS.md`, `README.md` |
| `api` | The backend service behind `/api/*` | TypeScript, npm | `main` · `PROJ-<n>-slug` | `AGENTS.md`, `TESTING.md` |
| `infra` | Cloud infrastructure as code | Terraform | `main` · `feat/…`, `fix/…` | `README.md` |

## Where a task goes

- **Screens, components** → `web`.
- **Endpoints, data, background jobs** → `api`.
- **Deploys, new services, domains** → `infra`.
- **Crosses front and back** (a new endpoint a screen consumes): one OpenSpec change with the contract in the proposal; one worker per repo builds each side at the same time.
- If it is not clear, ask before touching anything.

## Where things are kept

- `openspec/`: this hub is the OpenSpec store (schema `factory`: proposal → specs → tasks).
  - `openspec/changes/<task>/`: one task = one change (proposal, specs, tasks per repo, the coordinator's `result.md`, `rounds/<N>/` review reports).
  - `openspec/specs/`: the system's current requirements; they grow as each change is archived after merge.
- `decisions/NNNN-*.md`: decisions that affect more than one repo or how you work.
- `testing/<repo>/`: testing guides per repo (environments, users per role, data). The tester reads them next to the repo's own.
- `learnings/<repo>.md`: pitfalls and facts that were costly to find out, one dated line each, written by `factory retro`.
- `context/`: stable knowledge (product, architecture, glossary).
- Anything that belongs to a single repo goes **in that repo**, not here.

## Tickets and git

- Ticket ids (`PROJ-<n>`) go in the branch name and the commit.
- Every task gets a `.tasks/<task>/` folder with one folder per repo, prepared by `factory task-start`.

## Never

- Read `.env*` or any credentials file.
- Write to production, or run `docker compose down -v` / recreate running containers without being asked.
- Commit from the hub root: each repo is committed in its own git.
