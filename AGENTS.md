# code-factory

The engine of the factory: an orchestrator, coordinators and their team (specker, scout, worker, reviewer, tester, ui-designer…), the scripts that prepare tasks in git worktrees, the quality gate and the Herdr panels. **It belongs to no project**: any number of hubs use it, and each hub is a folder with its own `workspace.json`, context and specs.

Start with [docs/README.md](docs/README.md) (`factory docs` opens the docs as a web page).

## How it is used

- `factory <command>` runs a script from `bin/` (or from the hub's own `bin/`) against the hub you are in. `factory <agent>` starts a kit agent (`factory orchestrator -n orchestrator`). `factory` alone lists everything. Installed as `~/.local/bin/factory` → `bin/factory`.
- The hub is `$FACTORY_HUB`, else the nearest `workspace.json` walking up from the current directory, else the default hub in `~/.config/factory/hub` (`bin/lib/hub.sh`, which also sets `ENGINE`, `FACTORY_HOME` and `HUB_LABEL`).
- Kit sessions start with `--plugin-dir kit --settings "$(bin/lib/kit-settings)"`: the `FACTORY_HUB` / `FACTORY_HOME` env and the engine as an extra directory.
- Tasks come from the orchestrator chat or `factory task "<what and why>"` (`-f` for several, separated by `---`); they land in `<hub>/.board/inbox/`.

## What goes here and what goes in the hub

Here, only what is true for any project. A project's own things go in its hub, never in the engine:

- `workspace.json`: `repos` (roles `ui`/`api`/`infra`, `base`, `setup`, `taskServers`), `gate`, `servers`, `panels`, `routing`, `agents.<agent>` (`skills`, `tools`, `notes`, experimental `codeMode`), `notion` (optional).
- `<hub>/bin/<command>`: the hub's own commands. `<hub>/.claude/skills/`: its own skills (they load in `.tasks/<task>/` sessions too).
- The hub's `AGENTS.md`, `context/`, `testing/`, `learnings/`, `decisions/`, `openspec/`.

If a project needs something the engine cannot configure, add the configuration point here; do not write the specific case. A new prompt or script never names a project's repos, branches, tickets or services: it says "the repo with role `ui`", "`repos.<repo>.base`", "`<ticket>`".

## When you change the engine

- **A change here reaches every hub at once** (no build, no copy). Anything already open does not see it: an orchestrator or coordinator loads the kit at start (restart it) and an open panel has its command baked in (`factory hub-panel --replace` from the orchestrator pane). `pr-watch` and `sys-watch` are single-instance: kill them and restart the orchestrator to change their code.
- **Never test against a live hub** anything that launches work: a task in `.board/inbox/` is executed by that hub's orchestrator. Test in a throwaway hub: `factory hub-init <scratch>/x probe-x`, then `openspec store unregister probe-x` when done.
- Check: `bash -n` on the touched scripts; `factory panel <name> --rows ''`; a short session that loads the kit: `claude -p --model haiku --plugin-dir kit --settings "$(bin/lib/kit-settings)" "<question>"` from the hub or from `.tasks/<something>/`.
- A change that shows in use (a command, a `workspace.json` key, an agent's behaviour) updates `docs/` in the same commit; if they pile up, the `docs-sync` skill brings them up to date. `factory docs --check` must come out clean.
- Commit messages explain the why.

## Traps that already cost time

- The shell is zsh: an unquoted variable is not split into words (`for f in $files` gets one string). Pass lists with `xargs` or bash arrays. A bare `=word` expands to a command path (`echo =====` fails): quote it.
- With `set -e`, a failing command substitution in an assignment ends the script silently (e.g. `iconv` on accents): add `|| true` where the failure does not matter.
- `herdr agent list` returns the agents of **all** hubs sharing a Herdr session: pick the orchestrator by title **and** by the hub's `cwd`. A hub with `herdr.session` lives in its own session.
- macOS: `sed -i ''`, BSD sed has no `\|` in basic expressions (use `-E`), `/bin/bash` is 3.2 (no `mapfile`), backticks inside double quotes must be escaped.
- `.env*` files are never read, not even `.env.example`: scripts copy them without opening them. The kit enforces it with `deny` rules in `bin/lib/kit-settings.json`.
