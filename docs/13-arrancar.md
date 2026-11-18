# Start up

The **orchestrator** is the session that receives your requests and launches one task for each. It lives in Herdr, in a workspace called `hub`, with the hub's panels to its right.

## 1. Open Herdr in the hub

Pick one of the two:

```sh
# a) Inside Herdr, from the hub folder
cd ~/projects/my-hub
factory orchestrator -n orchestrator

# b) With Ghostty: a dedicated window for this hub, with its own Herdr session
factory open
```

`factory open` needs `"herdr": {"session": "<name>"}` in `workspace.json` and starts the orchestrator if it isn't running. With several projects, it is the way to keep them from getting mixed up ([One hub per Herdr session](27-hubs-y-sesiones.md#one-hub-per-herdr-session)).

## If Claude doesn't respond

The orchestrator starts with the provider that is set (`claude` by default). To continue with Cursor CLI:

```sh
factory provider cursor
```

Then start the orchestrator as above. The one that is already open stays on Claude: exit that session and start it again. In the pane you will see `orchestrator: cursor` and the process is `cursor-agent`. New tasks also run on Cursor. To go back, once Claude responds: `factory provider claude` and restart the orchestrator. The details are in [provider](27-hubs-y-sesiones.md#provider-claude-or-cursor).

## 2. What it does on startup

- Renames its workspace to `hub`.
- Opens the `panels.hub` panels to its right (the template ships `agentes`, `tareas` and `prs`).
- Launches the watchers `pr-watch` (your PRs: comments, conflicts, CI, merge) and `sys-watch` (Claude usage and notices), one instance of each.
- Picks up the tasks that were waiting in `.board/inbox/`.

## Check

- The workspace is called `hub` and on the right you see the `agentes` panel with the orchestrator.
- `alt+h` opens the shortcut cheat sheet.
- `factory usage` shows your Claude usage for the 5 h and 7 day windows.

If the panel doesn't appear, from the orchestrator pane: `factory hub-panel --replace`.

Next: your first task.
