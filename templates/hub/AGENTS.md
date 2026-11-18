# {{name}}

Working hub for {{name}}. Sessions are launched from here (`factory orchestrator`): this file says **which repo each task goes to**; each repo has its own rules. The engine (agents, scripts, panels) is the factory (`factory`, in `$FACTORY_HOME`); only what belongs to this project lives here.

## Golden rule

Before reading or editing a repo's code, read its entry point ("Docs" column) and follow its rules: stack, commands, branches, commits and tests belong to each repo, not to this hub. If anything here contradicts the repo, the repo wins.

## Repos

Repos live inside the hub as links to their checkout (`ln -s ../<repo> <repo>`); each has its own git and is added to `.gitignore`. Each repo also goes in `workspace.json` → `repos`, which is what the factory reads:

```json
"repos": {
  "<repo>": { "roles": ["ui"], "base": "main" }
}
```

- `roles`: `ui` (what a user sees: screens, components), `api` (services and data), `infra` (deployment, cloud). A monorepo can have several (`["ui", "api"]`). With `ui` there is a UI spec and an on-screen test.
- `base`: the branch tasks start from.
- `worktrees` (optional): `true` | `false` | `"on-demand"` for that repo only.
- `setup` (optional): command that prepares each new worktree before the task starts, with `$SRC` = the main checkout (e.g. `cp "$SRC/.env" . && pnpm install --frozen-lockfile`).
- `taskServers` (optional): `true` if its servers run per task in each worktree with the hub's `task-servers` command.

| Repo | What it is | Stack | Base branch · branches | Docs |
|---|---|---|---|---|
| `<repo>` | <what it is> | <stack> | `main` · `feat/<slug>` | `AGENTS.md` |

## Where a task goes

- <task type> → `<repo>`.
- If it is unclear, ask before touching anything.

How the pieces fit together: [context/architecture.md](context/architecture.md). Product and vocabulary: [context/product.md](context/product.md), [context/glossary.md](context/glossary.md).

## Where everything is stored

Each folder has a `README.md` saying what goes inside.

- `workspace.json`: the hub's configuration for the factory (repos, approvals, models by risk, gate, servers, panels; without a `notion` key, there is no task manager).
- `bin/` (optional): the hub's own commands, which only make sense in this project; they run with `factory <command>` just like the engine's.
- `.claude/skills/` (optional): the hub's own skills (for example, how to bring up the local backend); every factory session loads them.
- `openspec/`: OpenSpec store `{{store}}`. `changes/<task>/` one task = one change; `specs/` the current requirements. From outside the hub (`.tasks/`): `openspec … --store {{store}}`.
- `briefs/<task>/`: light spec when the task does not need full OpenSpec.
- `context/`: stable knowledge (product, architecture, glossary, environments).
- `decisions/`: decisions that affect more than one repo or how we work.
- `learnings/`: pitfalls and facts that were hard to discover (written by the retro).
- `testing/<repo>/`: per-repo testing guides for the tester.
- `audits/`: reports from `factory audit-start` (not versioned).
- `BACKLOG.md`: hub ideas and improvements ("note it down", "to the backlog").
- `personal/`: your own backlog and drafts (not versioned).
- `.board/`, `.tasks/`: the factory's working state (not versioned; do not edit by hand). `.board/inbox/`: tasks sent with `factory task` waiting for the orchestrator (`tareas` panel).
- What belongs to a single repo goes **in that repo**, not here.

## Never

- Read `.env*`, certificates or credential files.
- Write to production with a database MCP (querying it is allowed only if this file says which one).
- Commit the repos from the hub root: each repo is committed in its own git.
