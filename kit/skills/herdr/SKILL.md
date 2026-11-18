---
name: herdr
description: How to work with Herdr in a factory hub — inspect and drive coordinators (list, read, prompt, focus, wait), the hub/task workspace layout and its naming, and what never to do with the user's session. Use whenever you run a `herdr` command or the user asks about tasks, coordinators, panes or workspaces in Herdr.
---

# Herdr in a factory hub

Herdr is the terminal multiplexer the user works in: **workspaces → tabs → panes**, with coding agents recognised in their panes (states: `working`, `blocked`, `done`, `idle`, `unknown`).

Before any `herdr` command check `test "${HERDR_ENV:-}" = 1`. If it fails you are not inside Herdr: say so and stop.

The installed binary is the authority on syntax. When you need a command you have not used in this session, run `herdr --skill` (full official guide) or the group without a subcommand (`herdr agent`, `herdr pane`, `herdr workspace`). Never run bare `herdr` (it attaches the TUI) and never probe a mutating command by leaving out its arguments: `workspace create` with no arguments executes. Commands return JSON: read IDs from it, never guess them.

## Layout in this workspace

| Workspace | Agent | Started by |
|---|---|---|
| `hub` (always first) | orchestrator (Claude, title `orchestrator`) | the user: `factory claude-kit orchestrator -n orchestrator` |
| `jared` | Jared (Claude, task creation) | `factory jared <request file>` |
| `audit · <repo>` | auditor | `factory audit-start` |
| `<TICKET>-<n>` (one per task; the task name when it has no ticket) | coordinator (Claude, Herdr agent name = task name lowercased, title `<TICKET>-<n> · coordinator`) | `factory task-start` |

- Subagents (specker, scout, worker, reviewer, tester, ui-tester, task-creator) run **inside** a Claude session, not in panes. The kit's hook records them in `.board/` and shows the running ones under their agent in the sidebar (`└ 2×scout · worker`); `factory board` (prefix+t) draws the full tree. Herdr cannot address them.
- The `hub` workspace has the orchestrator pane plus a panel on its right (panes `agentes`, `notion`, `prs`, `servidores`, from `workspace.json` `panels.hub`, run by `factory panel <name>`). Leave them alone.
- Each task workspace has the coordinator pane plus a detail panel on its right (panes labelled `agentes`, `recursos` and `cambios`, from `factory task-panel`). Leave them alone; address the coordinator by its agent name, not by position.
- The `hub` workspace may also have a `servidores` tab (from `factory servers`, alt+5): the dev servers list plus one pane per server (`srv:<name>`). Start or stop servers only with `factory servers start|stop <name>`, never by touching those panes.
- Create workspaces, worktrees or agents **only through `factory task-start`, `factory jared` or `factory audit-start`**. Do not create, split, move or close panes, tabs or workspaces yourself unless the user asks. `factory task-end` closes a task's workspace.

## Following coordinators

```sh
herdr agent list                                # all agents: .result.agents[] {pane_id, workspace_id, agent_status, terminal_title_stripped}
herdr agent get <name>                          # one agent
herdr agent read <name> --source recent --lines 60   # what it has been doing (read-only)
herdr agent wait <name> --until done --until blocked --timeout 600000
```

- Map a task to its coordinator by its Herdr agent name (the task name lowercased, max 32 chars, e.g. `proj-2299-billing-fix`) or by `terminal_title_stripped` = `<TICKET>-<n> · coordinator`.
- `blocked` means a dialog is open for the **user** (a permission prompt, an AskUserQuestion). An agent that ended its turn asking for a "sí" in plain text (spec or plan approval) shows `done`/`idle`: read its last lines before calling it finished. Tell the user which workspace (`ctrl+b w`, or they can ask you to focus it). **Never answer a blocked dialog for them** and never send keys to it.
- Reading is always fine; `agent read` does not mark anything as seen.

## Talking to a coordinator

Only when the user asks you to pass something on:
```sh
herdr agent prompt <name> "<text>" --wait --timeout 600000
```
`prompt` refuses a blocked agent (`agent_blocked`): tell the user instead. If it is `working`, the message queues behind the current turn; say so.

## Focus

`herdr agent focus <name>` / `herdr workspace focus <workspace_id>` move the **user's** view: only on request. The user jumps back to the orchestrator with `ctrl+b a`.

## Never

- Answer approvals, send keys or `--takeover` another agent's pane.
- Close a workspace or pane that has a live agent, except through `factory task-end` after the user says the task is done.
- Stop or restart the Herdr server, change `~/.config/herdr/config.toml`, or touch saved machines/sessions.
