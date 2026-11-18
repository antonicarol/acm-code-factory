# Panels

Every Herdr panel is a list with the same behavior (`factory panel`):

- The title is the panel's label on the Herdr border. The first line is `▾ shortcuts`: a click there minimizes it.
- Minimized, it takes one line, `▸ click to open`, and the label gets a ` ▸`. A click anywhere on the
  panel restores it to its height. Also ctrl+b m / alt+m on the focused panel (`factory fold`).
- `ctrl-r` refreshes, it reloads itself every `REFRESH` seconds (not while minimized), and what an
  action prints appears next to the shortcuts.

Which panels you see is the hub's choice: `workspace.json` → `panels.hub` (next to the orchestrator) and `panels.task` (next to each coordinator); `panels.keys` rebinds alt+2…5. The engine's panels are only the defaults.

A new panel = a `panels/<name>.sh` file + its name in `workspace.json` → `panels.hub` (the panel to the
right of the orchestrator, `factory hub-panel`). Try it standalone with `factory panel <name>`.

Each hub picks its own in `panels.hub` and can have its own panels in `<hub>/panels/<name>.sh`: `factory panel`
looks there first and then here, so a hub panel with the name of an engine one replaces it. What belongs to a
project (its API, its services) goes in the hub; here, only panels that work for anyone. Inside the
definition, `$HUB` and `$ENGINE` are available.

```bash
TITLE="MY PANEL"                  # no parentheses
HELP="enter: open"                # shortcuts, on the first line; no parentheses or ~
REFRESH=60                        # background reload (0 = ctrl-r only)
rows(){ printf '%s\t%s\n' "key" "visible text"; }   # required: one row per line
fetch(){ ...; }                   # optional: the slow part (API, cache) before reloading rows
on_enter(){ open "$1"; }          # $1 = the row's key; on_ctrl-o, on_double-click…
                                  # a one-character key (on_1) acts only with an empty search box; otherwise it is typed
INTERACTIVE="enter"               # actions that ask something in the terminal
preview(){ ...; }                 # optional: row preview (? key)
```

`INPUT=0` removes the search line (display-only panels, like `agentes`). Heavy logic lives in its
script (`factory inbox`, `factory prs`, `factory servers`), which keeps its own commands; the panel only calls it.
