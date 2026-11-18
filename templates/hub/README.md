# {{name}}

Factory hub for {{name}}: the project's repos, context, specs and decisions. The engine is separate (`factory`, in `$FACTORY_HOME`); how it works inside: `$FACTORY_HOME/docs/`.

## Getting started

1. Link the repos: `ln -s ../<repo> <repo>` (and add them to `.gitignore` and to the `AGENTS.md` table).
2. Fill in `workspace.json` (gate and servers for each repo) and `context/`.
3. From this folder: `factory orchestrator -n orchestrator`, and give it the task in its chat; or from any terminal: `factory task "<what and why>"` (`-f tasks.md` for several, separated by `---`). Each task opens its own session.

`factory` with no arguments lists the commands and agents.
