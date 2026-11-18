---
name: docs-sync
description: Brings docs/ up to date with engine commits that are not reflected yet. Use it after finishing an engine change, when the user says "update the docs", "sync the documentation", "docs-sync", or when `factory docs --check` warns about something undocumented.
---

# docs-sync

`docs/*.md` is the source of the engine's documentation; `factory docs` turns it into a web page. This skill aligns it with the code.

## 1. What has changed

- The marker is in `docs/README.md`: `Up to date with commit <sha> (<date>)`.
- `git log --format='%h %s' <sha>..HEAD -- . ':!docs'` gives the pending commits. Ignore those that only touch `AGENTS.md` (`CLAUDE.md` is a link to it).
- A commit that already changed `docs/` may have left pages behind: look at its diff anyway, but quickly.
- `bin/docs --check` lists commands, agents, skills, panels, hooks and `workspace.json` keys that no page names.

## 2. Which page each thing affects

| Change in | Page |
|---|---|
| Installation: requirements, the `factory` link, `templates/herdr/config.toml` | `10-instalar.md` |
| `hub-init`, `templates/hub/` | `11-crear-un-hub.md` |
| A `workspace.json` key needed to get started (`repos`, `gate`, `approvals`, `ship`) | `12-configurar.md` |
| Orchestrator startup, `factory open`, watchers | `13-arrancar.md` |
| How a task enters and moves forward, as the user sees it | `14-primera-tarea.md` |
| Inbox, task panel, hub panels, shortcuts | `15-dia-a-dia.md` |
| Pieces, sessions, where each state lives | `20-arquitectura.md` |
| Task phases, rounds, loop limits | `21-ciclo-de-una-tarea.md` |
| `task-start`, worktrees, `setup`, servers, DBs | `22-repos-worktrees-entornos.md` |
| Specker, OpenSpec, risk, approvals | `23-spec-y-plan.md` |
| Gate, reviewer, tester, ui-tester, ui-designer | `24-calidad.md` |
| Ship, PR, `pr-watch`, review-loop, retro, closing | `25-entrega.md` |
| Auditor, Jared, task-creator, learnings | `26-auditorias-tareas-aprendizajes.md` |
| `hub.sh`, per-hub Herdr sessions, `kit-settings`, provider, hub extensions | `27-hubs-y-sesiones.md` |
| `bin/*`, `panels/*`, `kit/hooks`, `kit/mcp`, watchers | `30-herramientas.md` |
| Any `workspace.json` key (new, changed, default value) | `31-configuracion.md` |
| `kit/agents/*.md` (model, tools, inputs, outputs) | `32-agentes.md` |
| Something that fails or is fragile, or stops being so | `33-limites.md` |

The `1x` pages (Getting started) are a path for someone new: numbered steps, copy-paste code and a "Check" at the end. They only change if what a newcomer has to do changes; detail goes to `2x` (Concepts) or `3x` (Reference). The first digit of the file name decides the group on the web page; a new page follows that numbering.

A change usually touches two pages: the reference one (`3x`) and the one that tells the process (`2x`, sometimes `1x`).

## 3. How to write

- Read the diff and the code, not just the commit message. Document what the code does today, not the history ("before..., now...").
- Edit the sentence or row that already exists; do not add a section per commit. If something was removed from the engine, remove it from the docs too.
- Same tone as the rest: English, short sentences, commands and paths in backticks.
- The rules in `AGENTS.md` apply here: nothing specific to a project except in an **Example** block.

## 4. Wrap up

- `bin/docs --check` exits with 0 and `bin/docs --no-open` regenerates `docs/index.html`.
- Change the `docs/README.md` marker to the current `HEAD` (`git log -1 --format='%h %ad' --date=short`).
- One commit with the docs, message `docs: <what was brought up to date>`. If the user did not ask for a commit, leave the changes uncommitted and say so.
