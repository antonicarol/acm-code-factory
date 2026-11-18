# Configuration: `workspace.json`

A file at the root of each hub; its presence is what makes a folder a hub ([Hubs, sessions and extensions](27-hubs-y-sesiones.md#which-hub-is-used)). Scripts read it with `jq` and pass what is needed to the coordinator in its first message; prompts read the rest when they need it. A change affects tasks that start afterward. `factory task-start` saves the values each task ran with in `.board/tasks/<task>.json`.

Two complete examples: `templates/hub/workspace.json` (what `factory hub-init` copies) and `examples/pagelight-hub/workspace.json`.

## Task flow

| Key | Values | Default | Read by | Effect |
|---|---|---|---|---|
| `approvals.spec` | `ask` · `auto` | `ask` | task-start → coordinator | Does it wait for your "yes" on the spec? |
| `approvals.plan` | `ask` · `auto` | `ask` | task-start → coordinator | Does it wait for your "yes" on the plan? (the `routing` row can override it) |
| `openspec` | `auto` · `always` · `never` | `auto` | specker | Full or light spec ([Spec and plan](23-spec-y-plan.md)) |
| `ship` | `off` · `ask` · `draft` · `ready` | `off` | task-start → coordinator | What it does when finished ([Delivery and follow-up](25-entrega.md)) |
| `uiTests` | `on` · `off` | `on` | task-start → coordinator | On-screen test on tasks that touch a `ui` repo |
| `uiEnv` | `demo` · `local` | `demo` | task-start, coordinator, ui-tester | What the on-screen test runs against ([Repos, worktrees and environments](22-repos-worktrees-entornos.md#on-screen-test-environment-uienv)) |
| `worktrees` | `false` · `"on-demand"` · `true` | `false` | task-start, task-move | Main checkout or worktree ([Repos, worktrees and environments](22-repos-worktrees-entornos.md#main-checkout-or-worktree)) |
| `claude.parallel` | number | `2` | all main sessions | Simultaneous subagents |
| `claude.auditProfile` | `quick` · `standard` · `deep` | `quick` | audit-start | Depth of the security audit (`AUDIT_PROFILE` overrides it for one run) |
| `claude.auditBudget` | number | `12` | audit-start | Maximum agents in an audit |

Without an approval key, it asks (`ask`). With `auto`, doubts do not stop the work: the reasonable option is chosen and recorded as "Decision: …".

## `repos`

One object per repo; the key is its path relative to the hub. Details in [Repos, worktrees and environments](22-repos-worktrees-entornos.md#the-hubs-repos).

| Key | Values | Default | Read by | Effect |
|---|---|---|---|---|
| `repos.<repo>.roles` | list of `ui` · `api` · `infra` | `[]` | task-start → coordinator | How the task is planned: UI spec, on-screen test, testing guides |
| `repos.<repo>.base` | branch | `main` | task-move, ship, orchestrator (with the `AGENTS.md` table) | Starting branch and PR target |
| `repos.<repo>.worktrees` | same as `worktrees` | — | task-start, task-move | Overrides `worktrees` for this repo |
| `repos.<repo>.setup` | shell command | — | task-start | Prepares each new worktree, with `$SRC` = main checkout; log in `.board/setup/` |
| `repos.<repo>.taskServers` | `true` · `false` | `false` | task-start, task-move, tester, worker | Its servers run per worktree with the hub's `task-servers` |

## `gate`

Read by `factory gate` ([Quality: gate, review, tests and design](24-calidad.md#gate)).

| Key | Values | Effect |
|---|---|---|
| `gate.repos.<repo>.checks` | list of commands; `{base}` → `origin/<base>` | What the repo has to pass. A repo with no entry has no gate. |
| `gate.repos.<repo>.base` | branch | The base for `{base}` (separate from `repos.<repo>.base`; keep them equal) |
| `gate.protected` | globs | Existing files (tests, configs) whose change is reported as `protected:` |
| `gate.attention.<label>` | globs | Files reported as `attention:` in `result.md` and the PR (`migration`, `dependencies`, `ci/deploy`, `env`…) |

## `routing`

One row per risk level (`tiny`, `low`, `medium`, `high`), which the coordinator takes from the spec's Risk section ([Spec and plan](23-spec-y-plan.md#risk-and-routing)).

| Key | Values | Effect |
|---|---|---|
| `routing.<level>.worker` | `haiku` · `sonnet` · `opus` | Workers' model |
| `routing.<level>.reviewer` | same | Reviewer's model |
| `routing.<level>.reviewerEffort` | `low` · `medium` · `high` | Reviewer's effort |
| `routing.<level>.planApproval` | `ask` · `auto` | Optional: overrides `approvals.plan` at that level |

The template ships: `tiny` haiku/sonnet medium, `low` sonnet/sonnet medium, `medium` sonnet/sonnet high, `high` opus/opus high with `planApproval: ask`. With Cursor, those names are translated to the provider's models (Grok by default: `haiku` → `grok-4.7-low`, `sonnet` → `grok-4.7-medium`, `opus` → `grok-4.7-high`) and the coordinator launches each subagent with the already-translated id. The coordinator itself stays on the `opus` one.

## `reviewLoop`

| Key | Values | Default | Read by | Effect |
|---|---|---|---|---|
| `reviewLoop.fixes` | `auto` · `bot-auto` · `ask` | `ask` | review-loop | Which comments it fixes without asking |
| `reviewLoop.resolveThreads` | `bot-only` · `all` · `none` | `none` | review-loop | Which threads it resolves after replying |
| `reviewLoop.bots` | GitHub logins | `[]` | pr-watch, review-loop | Who counts as a review bot |
| `reviewLoop.rounds` | number | `3` | review-loop | Fix rounds per PR |

## Herdr, servers and local DB

| Key | Values | Default | Read by | Effect |
|---|---|---|---|---|
| `herdr.session` | name | — | hub.sh, claude-kit | The hub's own Herdr session ([Hubs, sessions and extensions](27-hubs-y-sesiones.md#one-hub-per-herdr-session)): outside Herdr, commands go to it and its workspace is called `hub` |
| `herdr.title` · `herdr.color` · `herdr.icon` | text · `#RRGGBB` · Ghostty icon (`xray`, `retro`, `holographic`, `blueprint`, `chalkboard`, `microchip`, `glass`, `paper`) or a path to an image (png/jpeg/icns; relative to the hub, e.g. `icon.png`) | hub folder · — · — | open | Fixed title of its Ghostty window and its dock icon, to tell hubs apart: `icon` if present; otherwise the official one with the screen in `color` |
| `panels.hub` | panel names: the engine's (`agentes`, `tareas`, `notion`, `prs`, `servidores`) or the hub's (`<hub>/panels/<name>.sh`) | — | hub-panel | Panels to the right of the orchestrator, in that order. A hub panel with the name of an engine one replaces it ([panels](../panels/README.md)) |
| `servers[]` | `{name, repo, cmd, ready, docker?, open?}` | `[]` | servers, ui-tester | Dev servers of the main checkout: `ready` is the URL that says it is up; `docker: true` is never stopped from here; `open: true` opens in the browser |
| `localDb` | `{project, mysql?, mongo?, notes?}` | — | kit `local-db` MCP | Docker compose project and service of each local DB engine; `notes` goes into the tool description. Without the key, the MCP offers no tools |
| `taskServers` | number | `2` | the hub's `task-servers` (not the engine) | Tasks with servers running at once, if the hub implements that command that way |

**Example:** `localDb: { "project": "<your compose project>", "mysql": "mysql", "mongo": "mongodb", "notes": "one DB per service…" }`.

## `tracker` (task manager, optional)

The tracker is pluggable: see [`trackers/README.md`](../trackers/README.md). Without `tracker` or `notion` there is no tracker: requests go through `factory task` and the orchestrator offers to note them in `BACKLOG.md`.

| Key | Values | Read by | Effect |
|---|---|---|---|
| `tracker.type` | adapter name (`notion` ships with the engine) | orchestrator | Which `trackers/<type>/TRACKER.md` it loads (the hub's own `<hub>/trackers/<type>/` wins). Default `notion` if the hub has a `notion` key |
| `tracker.<anything else>` | free-form | the adapter | Settings the adapter's `TRACKER.md` reads (status map, order, project keys…) |

## `notion` (task manager, optional)

Without the `notion` key there is no task manager: no `notion` panel, no Jared or task-creator; pr-watch does not ask to move statuses and the orchestrator offers to write requests down in `BACKLOG.md`. With it, the factory uses Notion as its task-manager adapter. Its prompts and scripts still assume a specific ticket format (ids like `PROJ-123`, a given tasks database): generalizing it is pending ([limits](33-limites.md)).

| Key | Values | Read by | Effect |
|---|---|---|---|
| `notion.idPrefix` | ticket prefix, e.g. `PROJ` | inbox, notion-page | Tickets are `<idPrefix>-<n>` (default `PROJ`) |
| `notion.tasks` | `collection://…` | orchestrator, inbox, notion-page, task-creator | Tasks database |
| `notion.idProperty` · `notion.statusProperty` | property names | orchestrator, notion-page | How to find a ticket by its number and which property to move |
| `notion.status` | `started` · `pr` · `merged` → value | orchestrator | Statuses it moves to |
| `notion.order` | list of statuses | orchestrator | To never move backward |
| `notion.sprints` | `collection://…` | inbox | Sprints for the `notion` panel: current sprint, next, backlog tabs and dates |
| `notion.me` | `https://app.notion.com/p/…` | inbox | Your page in the people database: the `notion` panel also counts tasks whose `Assignee` (relation) is you, even if the person field is empty |

## `agents` (per-agent extensions, optional)

| Key | Values | Read by | Effect |
|---|---|---|---|
| `agents.<agent>.skills` | hub skill names | `bin/lib/kit-dir` | The agent loads them before starting (and gains the `Skill` tool if it did not have it) |
| `agents.<agent>.tools` | tools, e.g. `mcp__<server>` | `bin/lib/kit-dir` | Added to its `tools` list (a whole MCP server with `mcp__<server>`) |
| `agents.<agent>.notes` | text | `bin/lib/kit-dir` | Hub instructions at the end of its prompt |
| `agents.<agent>.codeMode` | `true` | `bin/lib/agent-args` | **Experimental.** Starts the agent in Claude Code's [Code Mode](https://code.claude.com/docs/en/code-mode): it writes JavaScript that chains tools and only reads the result. Only with the `claude` provider, in an interactive session, Claude Code ≥ 2.1.323; the first time it asks you to confirm. It does not start with OpenTelemetry telemetry, `ANTHROPIC_BASE_URL` or some plugins (`/status` says why). Try it in a throwaway hub before enabling it |

`<agent>` is the file name in `kit/agents/` (`worker`, `ui-designer`, `tester`…). See [Extensions](27-hubs-y-sesiones.md#extensions-tuning-agents-from-the-hub).

**Example:** `coordinator` and `senior` get the query tool of a read-only database MCP, with a note: `SELECT` only, never write.

## Outside `workspace.json`

| Where | What |
|---|---|
| `<hub>/.openspec-store/store.yaml` | The hub's OpenSpec store id |
| `<hub>/AGENTS.md` | Table of repos, branches, ticket format, what is forbidden (read by the orchestrator and specker) |
| `~/.config/factory/hub` | Default hub |
| `bin/lib/kit-settings.json` | Common settings for kit sessions (plugins turned off) |
| `kit/.claude-plugin/plugin.json` | Kit version |
| `kit/.mcp.json` | Kit MCPs (`local-db`) |
| `kit/hooks/hooks.json` | Subagent and test-cleanup hooks |
| `~/.claude/rubrics/<repo>.md` | Personal addition to the reviewer's rubric |
| `~/.claude/testing/<repo>.md` | Personal notes for the tester and ui-tester |
