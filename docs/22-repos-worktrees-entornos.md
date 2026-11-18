# Repos, worktrees and environments

## The hub's repos

Each repo lives inside the hub as a link to its checkout (`ln -s ../<repo> <repo>`) and is declared in `workspace.json` → `repos`:

```json
"repos": {
  "web": { "roles": ["ui"], "base": "main", "setup": "cp \"$SRC/.env\" . && pnpm install --frozen-lockfile" },
  "api": { "roles": ["api"], "base": "develop", "worktrees": true }
}
```

| Key | What it's for |
|---|---|
| `roles` | `ui` (what a user sees), `api` (services and data), `infra` (deployment, cloud). A monorepo can have several (`["ui", "api"]`). With `ui` there is a UI spec, an on-screen test and a design critique. |
| `base` | Branch that tasks start from and that PRs target |
| `worktrees` | Overrides the global `worktrees` for this repo |
| `setup` | Command that prepares each new worktree (see below) |
| `taskServers` | `true` if its servers run per task in each worktree, using the hub's `task-servers` command |

The repo's key is its path relative to the hub (`web`, `group/other-repo`). The orchestrator also uses the repo table in the hub's `AGENTS.md` to know what each one is and how branches are named.

## Main checkout or worktree

Each task has `.tasks/<task>/<repo>`, which is one of two things:

| Form | What it is | What it's for |
|---|---|---|
| **Link** to the main checkout | The task's branch is checked out in your own checkout | Your local server sees the agent's changes immediately; you can edit code by hand |
| Git **worktree** | A separate checkout in `.tasks/<task>/<repo>` | Parallel tasks without stepping on each other or on you |

`factory task-start` decides using `worktrees` in `workspace.json` (or `repos.<repo>.worktrees`):

| Value | Behavior |
|---|---|
| `false` (default) | Main checkout. If it's busy, worktree. |
| `"on-demand"` | Like `false`, but it also counts as busy if you're on a branch that is neither the base nor the task's, even if everything is committed. Your work in progress never changes branch. |
| `true` | Always a worktree. |

"Busy" = another task linked to the same repo, uncommitted changes, or (on-demand) your branch. When it falls back to a worktree, `task-start` says so: `note: <repo> is on your branch … → worktree; when it is free: factory task-move <task>`.

- **`factory task-move <task>`** moves a task from a worktree to the main checkout so you can test it with your servers. It uses the same "busy" rule and the same lock as `task-start` (they share `bin/lib/checkout.sh`), so it never takes your checkout off your branch. Uncommitted work travels in a stash identified by its id: if a step fails, the work goes back to the worktree or the message says which stash holds it. Run it with the task's agents idle.
- **`factory task-end <task>`** removes worktrees (git refuses if there are uncommitted changes) or links (the branch stays active in your checkout).

In the main checkout, agents never revert, stash or reset files they haven't touched, and the commit includes only the files the workers said they changed.

## Preparing a worktree: `setup`

A new worktree doesn't have what git ignores. `task-start`:
1. Copies the ignored `.env*` files from the root of the main checkout, without opening them.
2. If the repo has `repos.<repo>.setup`, runs it in the worktree with `SRC` = the main checkout, **before** starting the coordinator (its workers and the gate need it ready). Use it to install dependencies or copy local files from subfolders. Output goes to `.board/setup/<task>-<repo>.log`; if it fails, `task-start` warns and the coordinator will see it.

## Per-task servers: `taskServers`

A repo with `repos.<repo>.taskServers: true` starts its servers inside each worktree, without colliding with yours. The engine doesn't know how: the hub's `task-servers` command (`<hub>/bin/task-servers`) does it, called by `task-start` (`seed`, `setup`, `env demo`), `task-move`, `task-end`, `sys-watch` and the tester (`start`, `stop`, `status`). The skill `factory:worktrees` explains to the agents how to use it.

Whoever starts servers stops them before reporting (the ui-tester, on every run). `task-end`, `task-move` and `sys-watch` also stop them.

**Example:** a hub can use `task-servers` to give each worktree its own port range, so servers from different tasks don't clash. The `taskServers` number at the root of `workspace.json` limits how many tasks have servers running at once; `start` waits for a free slot and exits with 75 if there isn't one. State and logs go in `.board/servers/<task>.*`. The hub's own skill for `task-servers` explains the details to the agents.

```
factory task-servers <task> seed | setup | env [demo] | start <app…> | stop | status
```

## On-screen test environment: `uiEnv`

| `uiEnv` | What it runs against | Consequences |
|---|---|---|
| `demo` (default) | A shared remote environment that the hub defines in its testing guide | No local backend or `api` branch. A flow that needs the task's backend, not yet deployed, moves to "manual QA". |
| `local` | The local stack | Tests `api` and `ui` together, but only the branch checked out in the `api` repo's main checkout (if the stack mounts it). |

- With `demo` and a repo with `taskServers`, `task-start` points the worktree at demo with `task-servers <task> env demo`.
- The coordinator receives "UI env: …" and **never asks** about the environment or asks to edit a `.env`.
- Test users by role and their credentials are given by the hub's testing guide (`testing/<repo>/`); passwords live outside the hub and no agent prints them.

## Shared backend and database

- **A single local backend.** If the local stack mounts the main checkout of the `api` repo, it runs whichever branch that has. A task in a worktree with `api` changes passes its suites, but its local on-screen test needs `factory task-move`.
- **A single local DB**, shared by all tasks and by you. Each task creates its own data under its own name and never deletes or changes anyone else's. The kit's `local-db` MCP reads and writes only in that DB (via `docker exec`, without seeing passwords), with no schema changes; it is configured with `localDb` ([Tools](30-herramientas.md#local-db-mcp)).
- **Docker**, with the common rules in the prompts and, if the hub has it, its `docker` skill:
  - Allowed without asking: starting Docker Desktop and `docker start` of a stopped container. The `servidores` panel does the same with `docker: true` entries: stopped containers → `docker start`; running but not responding → "rebuilding or broken", touching nothing; only if none exists does it offer its `cmd`, to a person and warning that it seeds the DB.
  - Only with your "yes": creating or recreating containers. A recreated container can re-seed the DB and wipe every task's data.
  - Never: restarting, rebuilding or bringing down (`down`) containers.
  - With `uiEnv: demo` the ui-tester doesn't touch docker.
