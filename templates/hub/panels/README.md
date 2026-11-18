# panels

This hub's own Herdr panels. Each is a `<name>.sh` in the engine's panel format (`$FACTORY_HOME/panels/README.md`) and appears to the right of the orchestrator if its name is in `workspace.json` → `panels.hub`. One with the name of an engine panel (`agentes`, `tareas`, `notion`, `prs`, `servidores`) replaces it in this hub.

Try it standalone with `factory panel <name>`; to see it in the hub panel, run `factory hub-panel --replace` from the orchestrator's pane.
