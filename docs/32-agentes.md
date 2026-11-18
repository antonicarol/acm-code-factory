# Agents

Defined in `kit/agents/<name>.md` (frontmatter: model, effort, tools; body: the prompt). They are invoked as `factory:<name>`, and the main sessions also as `factory <name>`. Without `tools` in the frontmatter, the agent has all the session's tools.

## Main sessions

| Agent | Model | Writes to | Never |
|---|---|---|---|
| **orchestrator** | Sonnet | `.board/requests/`, `.board/inbox/`, `.board/jared/`, `context/`, `decisions/`, `learnings/`, `BACKLOG.md`, `personal/`; with a task manager, the ticket's `Status` | Edit code, commit, create tasks in the task manager (that is Jared's job) |
| **coordinator** | Opus | spec, `tasks.md`, `ui.md`, `result.md`; repos only via ship/review-loop/resolve-conflicts | Write code except a trivial line; switch branches; archive |
| **senior** | Fable | what the coordinator writes + `design-plan.md` and the foundations in the repo (theme, tokens, a reference component) | The same as the coordinator, except the foundations; ship without review |
| **jared** | Sonnet | Task-manager tasks (via task-creator), `personal/backlog/`, `personal/drafts/` | Edit code or OpenSpec; start the work |
| **auditor** | Sonnet | `audits/<repo>/<date>-<types>/` | Modify the audited repo or run its code |
| **changelog** | Sonnet | `changelogs/<date>/` (HTML page using the hub's template, `CHANGELOG.md`, videos) | Edit code; list tasks instead of new features; record without your "yes"; change the template's design |

## Subagents

| Agent | Model · effort | Tools | Modes | Input | Output |
|---|---|---|---|---|---|
| **specker** | Sonnet · medium | Read, Grep, Glob, Bash, Write, Edit, Notion (read) | — | task, store, hub, request, folders | written spec (with Risk) + summary + questions with a default value |
| **scout** | Haiku · low | Read, Grep, Glob, Bash | — | concrete questions | conclusions with `path:line` |
| **ui-designer** | Sonnet · high | Read, Grep, Glob, Bash, Skill, Write | `plan`, `critique` | `ui` repo folder, app, spec; in critique: `ui.md`, screenshots, crops, `evidence.json`, round file | `plan`: UI spec (→ `ui.md`); `critique`: `APPROVE` / `CHANGES NEEDED` + findings |
| **worker** | per `routing` (Sonnet by default) · medium | edit, Bash, Skill, `local-db`, Figma | — | a repo's folder, plan, files, rules, how to verify | changed files, what it ran and the result, rules followed |
| **reviewer** | per `routing` · per `routing` (high by default) | Read, Grep, Glob, Bash, Skill, Write | normal, fix round | plan, folders, lenses, gate lines, round file (+ the previous one) | `APPROVE` / `CHANGES NEEDED` + `path:line — problem — fix` |
| **tester** | Sonnet · medium | Read, Grep, Glob, Bash | suites | folder, touched files, e2e only / scoped | `OK` / `BROKEN` / `BLOCKED` + `guideNotes` |
| **ui-tester** | Sonnet · medium | Read, Grep, Glob, Bash, `local-db` | `ui`, `capture`, `demo` | mode, plan or Capture list (in `demo`: script, name and output folder; records the raw take and its timeline), UI env, front-end folder, branch, task, screenshots directory, hub | `OK` / `BROKEN` / `BLOCKED` + flows, screenshots, video (`demo`), `needsUser`, `guideNotes` |
| **video-editor** | Sonnet · high | Read, Grep, Glob, Bash, Write, Edit, Skill | — | raw take, `events.json`, script, title and one-line summary of the feature, the hub's `GUIDE.md` and `assets/`, format, output folder | video edited with Hyperframes (mp4, gif, poster, project) + scenes and zooms |
| **task-creator** | Sonnet · medium | Read, Grep, Glob, Bash, Skill, Notion (read and write) | `draft`, `create`, `update` | request or findings | drafts and questions; creates only what is approved |

The Notion tools come from your own Notion MCP, not from the kit: it is part of the Notion adapter (see [Audits, task manager and learnings](26-auditorias-tareas-aprendizajes.md#task-manager-jared-and-task-creator)).

## Reuse rules (coordinator)

| Agent | Policy |
|---|---|
| worker | **One per repo for the whole task**, reused with `SendMessage` (only the delta). A new one if the reviewer rejects the approach, the change is in another area, it has had 2 fix rounds, its context goes past ~60k tokens or its id was lost. Never two at once in the same repo. |
| reviewer | Always new; from round 2 it receives the previous round's file. |
| tester, ui-tester, video-editor | Always new. |
| ui-designer | New for each critique; receives the previous critique if it blocked. |
| specker | The same one, to answer your questions. |

## Kit skills

| Skill | Loaded by | Purpose |
|---|---|---|
| `ui-test` | coordinator, on tasks with a screen | UI spec, on-screen test plan, ui-tester, critique and when it is ready |
| `ship` | coordinator | Commit, push, PR and screenshots |
| `review-loop` | coordinator | Review comments on the PR |
| `resolve-conflicts` | coordinator | Conflicts with the base |
| `retro` | coordinator, anyone with `/factory:retro` | Learnings with your approval |
| `worktrees` | tester, ui-tester, worker | Worktree model, the hub's `task-servers` contract, shared backend and DBs |
| `herdr` | orchestrator | Read and send messages to coordinators without breaking your panes |
| `tech-task-creator` | task-creator | Team guide for creating tasks in Notion |
| `security-audit` (Cloudflare, MIT, vendored) | auditor | Security audit |
| `impeccable` (pbakaus, Apache 2.0, vendored) | ui-designer | UX/UI judgment |

Vendored skills carry a `LICENSE` and an `UPSTREAM` file (source repo and commit).

**Hub skills** (`<hub>/.claude/skills/`) also load in every session of that hub, including those in `.tasks/<task>/`. **Example:** a `docker` skill that says what can be done with the hub's local stack and how to tell a backend that is recompiling from a broken one.
