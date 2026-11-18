# Tools

Everything deterministic lives in scripts: it is cheaper, faster, and fails differently than a model does. Agents call them; you can too. They all run as `factory <command>` and work on the hub resolved by `bin/lib/hub.sh` ([Hubs, sessions and extensions](27-hubs-y-sesiones.md#which-hub-is-used)).

## Engine commands (`bin/`)

### Hubs and sessions

| Command | What it does |
|---|---|
| `factory` | With no arguments: lists engine commands, hub commands and agents |
| `hub-init <folder> [store]` | Creates a hub from `templates/hub/` with its OpenSpec store and its git |
| `claude-kit <agent>` (or `factory <agent>`) | The provider CLI (`claude` or `cursor-agent`) with the kit loaded. With `orchestrator` it also renames the workspace to `HUB_LABEL`, opens the hub panel and starts `pr-watch` and `sys-watch` (one instance of each). With Cursor it prints `orquestador: cursor` |
| `task "<what and why>" [repo…]`, `task -f <file>` | Drops tasks into `.board/inbox/` and notifies the hub's orchestrator if it is running ([Day to day](15-dia-a-dia.md#handing-over-a-task)) |

### Task lifecycle

| Command | What it does |
|---|---|
| `task-start <task> <repo>:<branch>:<base>…` | Prepares branches, worktrees and `setup`; opens the workspace and starts the coordinator ([Lifecycle of a task](21-ciclo-de-una-tarea.md#1-request-and-start--orchestrator)) |
| `task-move <task>` | Moves a task from a worktree to the main checkout, keeping uncommitted work |
| `task-end <task> [--discard]` | Stops servers, removes worktrees/links, archives and closes the workspace |
| `open` | Opens the hub's own Herdr session (`herdr.session`) in a new Ghostty window and starts its orchestrator if it is not running ([Hubs, sessions and extensions](27-hubs-y-sesiones.md#one-hub-per-herdr-session)) |
| `provider [claude\|cursor]` | What the kit sessions start with, across all hubs, and their models. With Claude at 95% or more, new tasks start the coordinator in Cursor ([Hubs, sessions and extensions](27-hubs-y-sesiones.md#provider-claude-or-cursor)) |
| `usage` | Claude account usage: % of the 5 h and weekly windows and when they reset, from the status line of the last kit session (`bin/lib/statusline` saves it to `~/.cache/factory/usage.json` and then runs your own status line). It also appears at the top of the hub's `agentes` panel. A Cursor session does not update it |
| `ctx [N\|task]` | Context of the last tasks or of one: base, peak, turns and what each tool returned. Reads the Claude transcript and, if the task ran in Cursor, the Cursor one |
| `task-end --stale [--yes]` | Open tasks whose PRs are all merged or closed: lists them and, if you confirm, closes them (closed without merge → `--discard`). For tasks whose coordinator never got to close them; skips their retro |
| `gate <task> [repo…]` | Hub checks over the task's repos, plus `protected:` / `silenced:` / `attention:` ([Quality: gate, review, tests and design](24-calidad.md#gate)) |
| `pr-shots <repo> <pr> <images…>` | Uploads a PR's screenshots to the `pr-screenshots` branch through the GitHub API and prints their URLs |
| `task-panel <pane> <folder>` | Reopens a coordinator's detail panel |
| `pr-watch [--once]` | Watches PRs, comments, conflicts and CI ([Delivery and follow-up](25-entrega.md#pr-watch)) |
| `audit-start <repo> <type> [scope]` | Auditor in its own workspace ([Audits, task manager and learnings](26-auditorias-tareas-aprendizajes.md)) |
| `changelog [period]` | Changelog session in its `changelog` workspace: new features, improvements and fixes for the period, with videos ([Day to day](15-dia-a-dia.md#period-changelog)) |
| `jared <request>` | Starts Jared or hands it a request |

### View and navigate

| Command | What it does |
|---|---|
| `board` | Live tree: orchestrator, coordinators and their subagents with description and duration. On Claude they come from the hook; on Cursor, from the session transcript |
| `dash [port]` | The same tree as `board`, drawn as a diagram on a local web page (`127.0.0.1:7717`, opens by itself): left to right, the orchestrator, arrows to each coordinator (one per row) and, from each coordinator, arrows to its subagents in execution order, grouped into phases: `spec`, `build` and `round N` (a batch of fixes and the reviews it triggers; inferred from the agent type). A collapsed phase is a single node; open, its runs appear in a dashed box. Clicking a coordinator or a phase collapses or expands it (working coordinators and the running phase start open; `expandir`/`plegar` for everything). Whatever is working is drawn in peach with a moving line. Reads `herdr agent list` and `.board/`, keeps no state of its own; refreshes every 2 s. Page: `templates/dash.html` |
| `review` | A task's changes: branch → base, commits, files with `+/-`, diff with delta; `enter` opens the diff in Neovim |
| `changes` | lazygit in the repo you are in |
| `edit` | Neovim in the repo you are in |
| `prs` | Your open PRs (in the org of the hub's repos): review state, checks, pending threads |
| `servers` | Dev servers of the main checkout (`servers`): which are up, start and stop |
| `inbox`, `notion-page <ticket>` | Notion adapter: your tasks by priority, and a ticket saved in `.board/notion/` so it can be read in pieces |
| `panel <name>` | Common panel engine (fzf): `panels/<name>.sh` defines list, actions and help (`panels/README.md`) |
| `hub-panel`, `fold`, `goto`, `keys` | Herdr layout: hub panels, minimize, jump by label, cheat sheet (`alt+h`) |
| `ctx [N \| <task>]` | Context hygiene for task sessions, from the transcripts |
| `docs [--no-open]` | Generates (and opens) this documentation as a web page (`docs/index.html`) |

### Hub commands

`factory <command>` looks first in the engine's `bin/` and then in `<hub>/bin/`. The engine calls two of them if they exist:

| Hub command | Called by | Purpose |
|---|---|---|
| `task-servers <task> …` | task-start, task-move, task-end, sys-watch, ui-tester, worker | Per-worktree servers for the repos with `taskServers` ([Repos, worktrees and environments](22-repos-worktrees-entornos.md#per-task-servers-taskservers)) |
| `ui-preflight <task> <app…>` | ui-tester, coordinator | On-screen test requirements in seconds, `OK/WARN/FAIL` ([Quality: gate, review, tests and design](24-calidad.md#preflight)) |

### Watchers (start with the orchestrator)

- **`pr-watch`**: every 2 min, `gh` only. Notifies the orchestrator or the coordinator once per change. Log in `.board/pr-watch.log`.
- **`sys-watch`**: every minute it kills whatever is surely dead (orphaned test workers, processes of already-closed tasks), stops task servers that have no folder, and notifies you (macOS notification) if the system reports memory pressure (`kern.memorystatus_vm_pressure_level`, not the swap %, which on macOS almost never drops), if a process burns CPU for minutes, or if a task's coordinator has been "working" in Herdr for `STUCK_MINUTES` (20) with no change in its transcript or those of its subagents, Claude or Cursor (hung command, lost subagent). It also warns when a Claude usage window (5 h or weekly) passes 80% and 95%. Log in `.board/sys-watch.log`.

They are single-instance: to change their code, kill them and restart the orchestrator.

## Panels (`panels/`)

| Panel | Where | What |
|---|---|---|
| `agentes` | hub and task | `factory board` (in a task, only its session) |
| `tareas` | hub | `.board/inbox/` inbox (`factory task --list`) |
| `notion` | hub | `factory inbox` (only with a task manager) |
| `prs` | hub | `factory prs` |
| `servidores` | hub | `factory servers` |
| `recursos` | task | Screenshots from `.board/shots/<task>/` |

A new panel: a `panels/<name>.sh` file and its name in `panels.hub`. Try it standalone with `factory panel <name>` or `factory panel <name> --rows ''`.

## Kit hooks (`kit/hooks/hooks.json`)

| Hook | Script | Purpose |
|---|---|---|
| `PreToolUse` / `PostToolUse` (Agent), `SubagentStart`, `SubagentStop` | `subagents.sh` | Records each session's subagents in `.board/<session_id>` (for `board`) and mirrors them in the Herdr pane bar |
| `SubagentStop`, `Stop` | `reap-tests.sh` | Kills orphaned vitest/jest workers (parent PID 1), which can take GBs each |

## `local-db` MCP

`kit/mcp/local-db.mjs` (Node, no dependencies), registered in `kit/.mcp.json`; it reaches every session that loads the kit. Tools `mysql_query` and `mongo_eval` against the hub's **local** DBs, configured with `workspace.json` → `localDb` (docker compose project and service of each engine; without the key it offers none). It goes through `docker exec`, so passwords never leave the containers. Read and write of data, never of schema (`CREATE`, `ALTER`, `DROP`, `TRUNCATE`, `drop()`, `renameCollection`…), and at most 200 rows in MySQL. Needs the stack up. The tester uses it to create data for its flows. Test: `node kit/mcp/local-db.mjs --self-test`. A new kit MCP: an `.mjs` in `kit/mcp/` and its entry in `kit/.mcp.json`.

Production MCPs are not part of the kit. An agent only reaches one if the hub grants it (`agents.<agent>.tools`) and its `AGENTS.md` allows it, and only to read: you never write to production.

## Herdr

One workspace per main session:

| Workspace | Contents |
|---|---|
| `hub` (or `hub · <folder>` if it is not the default hub) | Orchestrator + `panels.hub` panels (and a `servidores` tab with one `srv:<name>` pane per server) |
| `<ticket>` or `<task>` | Coordinator + detail panel (`agentes`, `recursos`, `cambios`) |
| `jared`, `audit · <repo>`, `review · <repo>` | Jared and audits, with their agents on the right |

`herdr agent list` returns the agents of **all** hubs: scripts pick the orchestrator by title **and** by the hub's `cwd`. Shortcuts in [Day to day](15-dia-a-dia.md#shortcuts). The `factory:herdr` skill tells agents how to read and send messages to other panes without touching yours.
