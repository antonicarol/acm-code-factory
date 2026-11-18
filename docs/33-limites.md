# Known limits

State as of 2026-11-01. When one is fixed, it is removed from here. The engine's general pending work is in `EXPORT.md`.

## Engine

- **Little mileage outside its original projects.** Since the engine was split from the hub (2026-10-30), full tasks have run end to end: spec, ui-designer, worktree with its own servers, gate, on-screen test, PR and review. Missing: a project with a different stack and a task with `ui` and `api` at the same time.
- **The Notion adapter assumes a specific setup.** The tracker is pluggable (`tracker.type`, [`trackers/README.md`](../trackers/README.md)), but Notion's pieces (the `notion` panel, `bin/inbox`, `bin/notion-page`, Jared, `task-creator`, `tech-task-creator`) assume a tasks database with `Status`, `Priority`, `SPs` and `Assignee` properties, ticket ids like `<idPrefix>-<n>` (`notion.idPrefix`) and the `notion` MCP. Another tracker gets the four operations of its `TRACKER.md` (read a ticket, read a status, list pending work, move a status); it has no panel or creator agent unless the hub adds them.
- **Prompts with stack assumptions.** Prompts no longer name any project's stack; what is specific to each hub goes in its `AGENTS.md`, guides, commands and skills (for example a hub's own `task-servers` and `docker`). The Notion adapter is the remaining exception (above).
- **A kit change does not reach running sessions**: you have to restart them (and `factory hub-panel --replace` for the panels).

## Cursor

Tested: it loads the kit, delegates to our subagents and translates models. Not yet tested: a task end to end. The coordinator of a new task starts in Cursor when a Claude window is at 95% or more, without changing the orchestrator's provider. With Claude down, `factory provider cursor` also starts the orchestrator in Cursor CLI (restart it); `notion-page` still calls `claude -p`.

- **Subagents use the model of the agent that launches them** if the coordinator does not pass them a provider id: Cursor ignores the `model:` of a plugin's agents and the names `haiku`/`sonnet`/`opus`. The "Environment" section carries the map and the hub's already-translated `routing` table, and tells it that a rejected id is replaced by another of the same level (low, medium, high), not by its own. The scout stops at 25 turns through the prompt: this provider does not apply `maxTurns`.
- **An agent with invalid frontmatter is not registered.** An unquoted description containing `:` makes Cursor skip the file: it happened to `ui-designer`, `ui-tester`, `auditor` and `task-creator`. The coordinator does not search the repo either; that is the scout's job.
- **No Claude Code-specific tools** (`SendMessage`, `Monitor`, `ScheduleWakeup`, `AskUserQuestion`): the coordinator launches a new worker where it would reuse one.
- **`factory usage` is still Claude's.** A Cursor session does not write that meter. The `agentes` panel, `factory ctx`, the stalled-task notice and `pr-watch` compaction read the Cursor transcript (`/summarize` when what is recorded passes ~100k tokens; Cursor does not store real usage, so that figure is the transcript text). The kit hooks do not run there; test cleanup is still done by `sys-watch` every minute.
- `notion-page` still uses `claude -p`.

## On-screen test

- **`ui` + `api` of the same task are not tested together on screen.** With `uiEnv: demo`, flows that need the new backend go to manual QA. With `local`, it only works if the task is in your main checkout of the `api` repo. Planned way out: an ephemeral environment per PR.
- **States that require clicks** (dialogs, menus, tabs) need a custom script from the tester, which is the most fragile part.
- **A `ui` repo linked to the main checkout is not pointed at demo**: it uses your local config, even if the coordinator believes it is demo.

## Quality

- **The reviewer does not catch every convention** that review bots or you later ask for (duplicated logic, tokens, file separation). What only CI checks shows up on the PR.
- **Optional findings are parked on purpose** and sometimes come back in the PR review as one more round.
- **Design critique is new** (wireframe, crops, measurements): still little validated on real tasks.
- **Default decisions** (`approvals: auto`) are recorded as "unconfirmed" and appear under "⚠ Requires attention", but nothing forces you to review them.

## Local environment

- **A single shared local DB**: a recreated container can reseed it for everyone. The rules forbid it without your "yes" and the `servidores` panel does not offer it unless no container exists at all, but an agent with Bash could still run it.
- **Long pre-push hooks** (building and testing a whole monorepo) time out under load; it retries once. Making them incremental is up to the repo, not the engine.

**Example:** a project's own limits (flaky e2e tests of a service against the same DB and Redis, front-end components that render badly, shared users in demo) are not the engine's: they go in the hub's `learnings/`.

## Process

- **`factory audit-start` requires a git repo**: auditing the hub itself is done by hand with reviewers.
