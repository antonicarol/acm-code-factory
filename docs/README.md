# The factory

The factory turns a request ("add X to screen Y", a ticket) into a **reviewed and tested PR**. A team of Claude Code agents carries it from start to finish: spec, plan, implementation, gate, review, tests and delivery. You approve at the points you choose.

Up to date with commit `ae12141` (2026-11-01) · `factory` kit 0.33.0. To bring them up to date: the `docs-sync` skill; `factory docs --check` warns about anything that appears on no page.

## Start here

Six steps, in order. In one afternoon you have your first PR.

| | Step | What you get |
|---|---|---|
| 1 | [Install](10-instalar.md) | The `factory` command and the Herdr shortcuts |
| 2 | [Create a hub](11-crear-un-hub.md) | Your project's folder, with its repos |
| 3 | [Configure](12-configurar.md) | `workspace.json`: repos, gate and approvals |
| 4 | [Start up](13-arrancar.md) | The orchestrator running with its panels |
| 5 | [Your first task](14-primera-tarea.md) | From one sentence to a PR |
| 6 | [Day to day](15-dia-a-dia.md) | Inbox, panels, shortcuts |

## Engine and hubs

| | What it is | Where |
|---|---|---|
| **Engine** | Agents, skills, hooks and MCP (`kit/`), scripts (`bin/`), panels, OpenSpec schema, hub template and these docs. One for all projects. | `code-factory/` |
| **Hub** | One folder per project: `workspace.json`, `AGENTS.md` (repo map), `context/`, `learnings/`, `openspec/`, the linked repos and the task state (`.board/`, `.tasks/`). | Wherever you like; created with `factory hub-init` |

A change in the engine reaches every hub immediately: there is no build or copy. Anything that only applies to one project is marked as **Example**; a complete example hub is in `examples/`.

## Who does what

- **Orchestrator** (Sonnet, Herdr `hub` workspace): receives requests, decides repos and branches, launches one coordinator per task. It doesn't implement.
- **Coordinator** (Opus, one workspace per task): spec → plan → workers → gate → review and tests → PR. It doesn't write code.
- **Subagents** (Sonnet/Haiku, or Opus depending on risk): specker, scout, ui-designer, worker, reviewer, tester, ui-tester.
- **Jared**, **auditor** and **changelog**: separate sessions to create tasks in the task manager (if the hub has one), audit repos and write the period's changelog with videos of what's new.
- **Kit** (`kit/`): the `factory` Claude Code plugin, with all the agents, skills, hooks and the `local-db` MCP.
- **Scripts** (`bin/`, via `factory <command>`): prepare repos, environments and checks without spending tokens; the agents call them.

## The rest of the documentation

**Concepts**: how it works inside. [Architecture](20-arquitectura.md), [Task lifecycle](21-ciclo-de-una-tarea.md), [Repos, worktrees and environments](22-repos-worktrees-entornos.md), [Spec and plan](23-spec-y-plan.md), [Quality](24-calidad.md), [Delivery](25-entrega.md), [Audits, task manager and learnings](26-auditorias-tareas-aprendizajes.md), [Hubs, sessions and extensions](27-hubs-y-sesiones.md).

**Reference**: for looking something specific up. [Tools](30-herramientas.md) (commands, panels, hooks, MCP), [Configuration](31-configuracion.md) (every `workspace.json` key), [Agents](32-agentes.md), [Known limits](33-limites.md).

**Guide**: [Best practices](34-best-practices.md): safety, verification, keeping instructions short and trying Code Mode.

The web version of these pages: `factory docs` (the `.md` files are the source; the template is `docs/_site.html`).
