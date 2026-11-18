# Hubs, sessions and extensions

How the factory finds the hub you work in, how its sessions start, and how a hub adds its own things without touching the engine.

## The `factory` command

Installed once: `~/.local/bin/factory` is a link to the engine's `bin/factory`. It does three things:

| Form | What it does |
|---|---|
| `factory <command> [args]` | Runs the engine's `bin/<command>` on the hub you are in (`factory task-start …`, `factory gate …`) |
| `factory <hub command> [args]` | If the engine doesn't have it, runs `<hub>/bin/<command>`: a project's own commands |
| `factory <agent> [claude args]` | Starts that kit agent (`factory orchestrator -n orchestrator` = `factory claude-kit orchestrator -n orchestrator`) |

`factory` with no arguments lists the engine's commands, the hub's and the agents.

## Which hub is used

`bin/lib/hub.sh`, which every script loads, resolves the hub in this order:

1. `$FACTORY_HUB`, if set.
2. The nearest `workspace.json` walking up from the current directory (from a task, `.tasks/<task>/<repo>`, it also finds its hub).
3. The default hub, at `~/.config/factory/hub` (used by the Herdr keys, which run outside any hub).

It also sets `ENGINE` / `FACTORY_HOME` (the engine) and `HUB_LABEL`: the label of the orchestrator's Herdr workspace, `hub` for the default hub or one with its own session, and `hub · <folder>` for the others. This way you can have two hubs open at once without their orchestrators getting mixed up.

## One hub per Herdr session

With several hubs, each one can live in its own Herdr session: a separate server with its own workspaces, panes and agents, and the same `~/.config/herdr/config.toml` (keys and sidebar). One Ghostty window or tab per hub and nothing gets mixed: the sidebar and `herdr agent list` only show that hub's.

1. In the hub's `workspace.json`: `"herdr": {"session": "<name>"}`; optionally `"title"` (the title of its Ghostty window) and, for its dock icon, `"color"` (`#RRGGBB`: the icon's screen) or `"icon"` (a Ghostty icon such as `xray` or `retro`, or the path to an image).
2. Open it with `factory open` from the hub (or from any terminal with `FACTORY_HUB`): a Ghostty window attached to `herdr --session <name>` (created if it doesn't exist) and, if its orchestrator isn't running, it starts it there. By hand: `herdr --session <name>` and inside it `factory orchestrator -n orchestrator`. Careful: if your Ghostty has `command = herdr`, a normal new window goes to the default session.

### All hubs in one window

Instead of one window per hub, a single one that switches hubs: put `command = ~/.local/bin/factory hubs` in your `~/.config/ghostty/config` (or run it in any terminal). It asks which hub (the OpenSpec stores with `herdr.session`), attaches to its session and starts its orchestrator if it isn't running. To switch, `alt+f` inside Herdr: you pick another hub and the window moves to its session; the previous one keeps running (orchestrator, tasks, `pr-watch`). When you leave Herdr (`ctrl+b q`) the selector returns; `esc` in it closes the window. Without an open `factory hubs` window, `alt+f` opens the chosen hub in its own window, like `factory open`. The window title is the hub's `herdr.title`; the dock icon is Ghostty's (only `factory open` changes it per hub).

Inside Herdr every pane already carries its session's socket, so the orchestrator, coordinators, `pr-watch`, `sys-watch` and the keys talk to their own. Outside Herdr (`factory task "…"` from a terminal), `hub.sh` exports `HERDR_SESSION` and `HERDR_SOCKET_PATH` (`~/.config/herdr/sessions/<name>/herdr.sock`) for the hub's session. If you start its orchestrator in another session, `claude-kit` warns you.

When you move a hub to its own session: tasks already running in the previous one end there; close its old orchestrator and start it again in the new one.

## Kit sessions

Every kit session starts with `--plugin-dir <engine>/kit --settings "$(bin/lib/kit-settings)"`. `kit-settings` writes `<hub>/.board/kit-settings.json` from `bin/lib/kit-settings.json` and adds to it:
- `env.FACTORY_HUB` and `env.FACTORY_HOME`, which hooks, agents and skills use to find the hub and the engine;
- the engine as an extra directory (`permissions.additionalDirectories`).

`kit-settings.json` has an `enabledPlugins` map (empty by default): list global plugins as `"name@marketplace": false` to keep their tools out of kit sessions, so you don't pay for them on every turn. It also carries read `deny` rules on `.env` and `.env.*`: the harness checks them before any classifier, so "`.env*` files are never read" doesn't depend on the prompt alone (they don't stop a script the agent runs from opening them: a sandbox would limit that). A kit change is picked up when the session **starts**: an open orchestrator or coordinator keeps the kit it started with.

## Provider: Claude or Cursor

Kit sessions start with Claude Code or with Cursor CLI (`cursor-agent`), for all hubs:

```sh
factory provider            # which one is set, its models, and whether new tasks are diverted to Cursor
factory provider cursor     # new sessions use Cursor; open ones keep theirs (restart them)
factory provider claude
```

The orchestrator starts with the provider that is set. If Claude doesn't respond, run `factory provider cursor` and restart the orchestrator (`factory orchestrator -n orchestrator` or `factory open`): that session is `cursor-agent`, and so are new tasks. A new task's coordinator starts the same way, and its team (specker, worker, reviewer, tester) runs inside that session. When the provider is still Claude and a live usage window (5 h or weekly, whichever the status line stores in `~/.cache/factory/usage.json`) is at 95 % or more, `task-start` starts that coordinator on Cursor and the orchestrator stays on Claude. Sessions already open keep theirs. When the window resets, the next task goes back to Claude. The `.board/tasks/<task>.json` record stores `provider`.

With Cursor the same kit is loaded (`--plugin-dir`: agents and skills). `bin/lib/kit-dir` generates `<hub>/.board/kit-cursor` with each agent's `model:` translated and an "Environment" section (hub and engine paths, model equivalences, what to do without Claude Code's own tools). The orchestrator's tells it to route with `factory task-start` and not to launch workers. The agent's role goes in the first prompt, because Cursor has no `--agent`, and permissions are `--force` (Run Everything: it doesn't stop at the plan or at each command) plus `--approve-mcps`. The coordinator doesn't read the repo (that's the scout, which stops after 25 turns) and, if a subagent model is rejected, it uses another of the same tier instead of moving up to its own. Default models are Grok's (`bin/lib/providers.json`): `opus` → `grok-4.7-high`, `sonnet` → `grok-4.7-medium`, `haiku` → `grok-4.7-low`. The coordinator starts on the `opus` one (whoever decides, as in Claude). The worker and reviewer come from the hub's `routing`; `kit-dir` writes that table already translated into the coordinator's Environment section, because Cursor doesn't accept the names `haiku`/`sonnet`/`opus`. To change them, use `~/.config/factory/providers.json`, which takes precedence over the engine's:

```json
{"cursor": {"models": {"opus": "claude-opus-5-thinking-high", "sonnet": "gpt-5.6-luna-high"}}}
```

`cursor-agent --list-models` gives the names. From 95 % of a window, new tasks move the coordinator to Cursor on their own; at 100 %, `sys-watch` warns that the window is exhausted and until when. When it resets, it warns that tasks go back to Claude (if the provider was changed by hand, the warning includes `factory provider claude`). What doesn't work with Cursor yet is listed in [limits](33-limites.md#cursor).

## What goes in the hub and not in the engine

| In the hub | What for |
|---|---|
| `workspace.json` | Repos and their roles, approvals, gate, servers, panels, models by risk, task manager |
| `AGENTS.md` (= `CLAUDE.md`) | Repo map, base branches and branch names, ticket format, what is never touched |
| `<hub>/bin/<command>` | Own commands, run with `factory <command>`. The engine calls some if they exist: `task-servers` (per-task servers) and `ui-preflight` (on-screen test checks) |
| `<hub>/.claude/skills/` | Own skills; they also load in `.tasks/<task>/` sessions |
| `<hub>/panels/<name>.sh` | Own panels for `panels.hub` (or replacing an engine one with the same name). Same format as the engine's `panels/` |
| `context/`, `testing/`, `learnings/`, `decisions/`, `openspec/`, `briefs/`, `audits/`, `personal/`, `BACKLOG.md` | The project's knowledge and specs |

**Example:** a `task-servers` command (front ends per worktree in their own port slot) and a `ui-preflight` command, plus a `docker` skill (what can be done with the local stack) and a `task-servers` skill (port slots and the recipe for its worktrees).

## Extensions: tuning agents from the hub

A hub adds its own things without touching the engine:

| What | Where | How it reaches the agents |
|---|---|---|
| Skills | `<hub>/.claude/skills/<name>/SKILL.md` | Every session of the hub and its tasks sees them; an agent loads them by their description or because `agents` asks it to |
| Per-agent settings | `workspace.json` → `agents.<agent>`: `skills`, `tools`, `notes` | On every start `bin/lib/kit-dir` generates `<hub>/.board/kit`: the engine's kit, linked, and the named agents with a "This hub" section at the end (skills to load, tools, notes) and those tools in their `tools` list |
| MCP | `<hub>/.mcp.json` | Not yet enabled: it needs `enableAllProjectMcpServers` in `bin/lib/kit-settings.json` (change it yourself; it's a permission) and the server in `agents.<agent>.tools` as `mcp__<server>` (all its tools) |
| Commands | `<hub>/bin/<command>` | `factory <command>`; the engine calls some if they exist |

Without `agents`, the hub uses the engine's kit as is. An engine change still arrives immediately: the hub's copy is rebuilt on every start.

**Example:** a read-only database MCP given to a single agent: its server in `<hub>/.mcp.json` and `"agents": { "worker": { "tools": ["mcp__<server>"], "notes": "Read-only queries only." } }`. Another: a `design-system` skill in `.claude/skills/` and `"agents": { "ui-designer": { "skills": ["design-system"], "notes": "…" }, "worker": { "skills": ["design-system"] } }`.

## Changing the engine

- A change here arrives immediately in all hubs. What is already open doesn't see it: restart the orchestrator or coordinator; for an open panel, `factory hub-panel --replace`. `pr-watch` and `sys-watch` are single-instance: to change their code, kill them and restart the orchestrator.
- Never test something that launches work against a live hub (a task in `.board/inbox/` gets executed by its orchestrator). Use a throwaway hub: `factory hub-init <scratch>/x probe-x` and, when done, `openspec store unregister probe-x`.
- To check: `bash -n` on the scripts touched, `factory panel <name> --rows ''` and a short session with the kit: `claude -p --model haiku --plugin-dir kit --settings "$(bin/lib/kit-settings)" "<question>"` from a hub.
