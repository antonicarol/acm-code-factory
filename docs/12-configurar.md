# Configure

`workspace.json`, at the root of the hub, tells the factory how to work on this project. The template already ships with reasonable values; for your first task three things are enough: the repos, the gate and how much you want to approve by hand.

## 1. Repos

One entry per linked repo, with its role and its base branch:

```json
"repos": {
  "web": { "roles": ["ui"],  "base": "main" },
  "api": { "roles": ["api"], "base": "main" }
}
```

- `roles`: `ui` (what a user sees), `api` (services and data), `infra` (deployment). A monorepo can have several. With `ui`, the task gets a UI spec and an on-screen test.
- `base`: the branch tasks start from and PRs target.

## 2. Gate

The gate is the set of checks the code must pass before anyone reviews it. Use the commands you already run in CI:

```json
"gate": {
  "repos": {
    "web": { "base": "main", "checks": ["pnpm lint", "pnpm typecheck", "pnpm test"] },
    "api": { "base": "main", "checks": ["npm run lint", "npm test"] }
  }
}
```

A repo with no entry has no gate. `protected` and `attention` already come in the template: they warn if a task touches existing tests, migrations or dependencies.

## 3. How much you approve

```json
"approvals": { "spec": "ask", "plan": "ask" },
"ship": "ask"
```

- `ask` in `approvals`: the coordinator shows you the spec and the plan and waits for your "yes". Leave it like this for your first tasks.
- `ship`: what it does when finished. `off` creates no PR, `ask` asks you, `draft` or `ready` create it on their own.

## The rest, when you need it

| If you want… | Key |
|---|---|
| An isolated branch per task (several tasks at once in the same repo) | `worktrees` and `repos.<repo>.setup` |
| Dev servers visible and startable from a panel | `servers` |
| A different model depending on task risk | `routing` |
| On-screen testing with Playwright | `uiTests`, `uiEnv` |
| The PR's comments handled automatically | `reviewLoop` |
| Your own skills or notes for an agent | `agents.<agent>` |

All of them, with their default value and who reads them: [Configuration reference](31-configuracion.md). A complete example hub: `examples/web-app/workspace.json`.

## Check

```sh
jq '{repos: (.repos | keys), gate: (.gate.repos | keys)}' workspace.json
```

It must list your repos in both places; if `jq` errors, the JSON is broken. Run each gate check yourself in its repo, on the base branch: if it already fails there, it will fail on every task.

Next: start the orchestrator.
