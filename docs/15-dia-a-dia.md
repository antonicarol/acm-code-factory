# Day to day

With the hub up and running, this is what you will use every day: how tasks come in, how to follow them, the panels and the shortcuts.

## Handing over a task

- **In its chat**: a `<ticket>` ticket, a link or your own words.
- **From any terminal, script or other agent**: `factory task "<what and why>" [repo…]` (the repos are a hint; the orchestrator decides), or `factory task -f tasks.md` with several separated by a `---` line. Each one is left as a file in `<hub>/.board/inbox/`; if that hub's orchestrator is running it is notified immediately, and if not, it picks them up on startup. When it launches one, it moves it to `.board/inbox/done/`.
- **`tareas` panel**: the inbox (`enter` sends it to the orchestrator, `ctrl-x` discards it, `?` shows it).
- **With a task manager** (`notion` key): `notion` panel (`factory inbox`), in tabs: current sprint, next, backlog and dates (`1`-`4` or `tab` / `shift-tab` switch tabs while the search box is empty; `ctrl-f` picks the range). `enter` sends the task to the orchestrator.

The orchestrator decides the repos and branches, leaves the request in `.board/requests/<task>.md` and runs `factory task-start`: a new workspace appears in Herdr with the task's coordinator. What follows is in the [task lifecycle](21-ciclo-de-una-tarea.md).

## Following a task

- The coordinator shows you the spec and the plan **in its pane**, and waits for your "yes" if `approvals.spec` / `approvals.plan` is `ask`.
- **Task panel**, to the right of the coordinator (`factory task-panel`): **agentes** (its subagents in order, with description and duration), **recursos** (the screenshots in `.board/shots/<task>/`, newest on top) and **cambios** (`factory review`: each repo with its branch → base and its commits, the touched files with `+/-`, ● = uncommitted, and the diff with delta; `enter` opens the diff in Neovim, `ctrl-e` edits, `ctrl-l` lazygit; `ctrl-n` jots a note on the file and line, `ctrl-o` edits the notes and `ctrl-s` sends them all together to the coordinator, which treats them as adjustments from you). For a coordinator launched earlier: `factory task-panel <pane> <.tasks/<task> folder>`.
- When it finishes, `result.md` is left next to the spec; with `ship` other than `off`, so are the PRs.
- Once the PR is merged, the coordinator closes the task on its own (`factory task-end`, notified by `pr-watch`).

## Period changelog

Ask the orchestrator for it ("make this week's changelog") or run `factory changelog [period]` (`since 2026-11-01`, `last week`): it opens a session in its own Herdr workspace `changelog` that reads the tasks closed since the last changelog (those archived in `openspec/changes/archive/` and `briefs/archive/` with the PR merged) and writes a page for people who use the product: **New**, **Improvements** and **Fixes**, grouping the tasks that make up a single feature, with no ticket ids or component names. It shows you the draft and proposes the videos; nothing is recorded without your "yes".

Each video comes out in two steps:

1. **Recording**: a `ui-tester` in `demo` mode uses the new feature in the `uiEnv` environment, from the main checkout of the `ui` repo on its base branch (login off camera, visible cursor). It saves the raw take and a timeline with where and when each step happens (`events.json`).
2. **Editing**: a `video-editor` assembles it with [Hyperframes](https://hyperframes.heygen.com): it starts right at the change (no navigation or loading beforehand), the recording sits in a frame with the waits cut out, with zoom and focus on each click and a caption per step, and ends on the result. An intro or outro card only if the hub's `GUIDE.md` asks for them. It checks frames before rendering and leaves the project so you can fine-tune it.

Everything ends up in `changelogs/<date>/`: `index.html` (the page, with the hub's design), `CHANGELOG.md` (to paste into your docs tool or Slack) and `videos/<feature>.{mp4,gif,jpg}` with its Hyperframes project. Publishing it is your decision.

**Hub configuration**, in `changelogs/` (all optional; with nothing, the engine's defaults are used):

- `GUIDE.md`: product, audience, language and tone, what counts as internal, how many videos and about what, format and branding. For example:

  ```markdown
  Product: My App · Audience: product, sales and support team · Language: English, second person, no jargon
  Internal: infrastructure, telemetry, refactors and tests; one line at the end at most
  Videos: up to 3, only features that the end user or moderator sees; landscape format; soft music yes, voice no; no intro or outro card
  Brand: background #0f0f14, accent #ff7a1a, typeface Space Grotesk, logo assets/logo.svg
  ```
- `template.html`: the page's design. Start from the engine's (`templates/changelog.html`) and respect its contract, described in the comment at the top: `{{…}}` fields, `data-repeat`, `data-section` and `data-if` blocks. Everything else (styles, header, footer) is yours.
- `assets/`: logo, fonts and music named by the guide and the template; they are copied next to each page.

## Hub panel

To the right of the orchestrator, the panels from `workspace.json` → `panels.hub`, stacked (each one is `panels/<name>.sh` via `factory panel`):

| Panel | What it shows |
|---|---|
| `agentes` | `factory board`: orchestrator, one coordinator per task and their subagents |
| `tareas` | The `.board/inbox/` inbox |
| `notion` | Your tasks from the task manager (only with the `notion` key) |
| `prs` | `factory prs`: your open PRs, `enter` opens, `?` checks |
| `servidores` | `factory servers`: the dev servers from `servers`; each one runs in an `srv:<name>` pane of the `servidores` tab |

It opens when the orchestrator starts if its tab has no other panes. To rebuild it: `factory hub-panel --replace` from the orchestrator pane (an open panel carries its command baked in, so this is also the way to pick up an engine change).

## Shortcuts

No prefix, in any workspace (`factory goto` resolves them by the pane's label, not by its position):

| Key | Goes to |
|---|---|
| `alt+1` | Main session (orchestrator or coordinator) |
| `alt+2` | agentes |
| `alt+3` | notion (hub) · cambios (task) |
| `alt+4` | prs |
| `alt+5` | servidores |
| `alt+0` | The hub's orchestrator |
| `alt+m` | Minimize / restore the focused pane (`factory fold`) |
| `alt+e` | Neovim in the repo you are in (`factory edit`; in a task with several repos it asks which) |
| `alt+h` | Cheat sheet with all the shortcuts (`factory keys`) |

With the `ctrl+b` prefix: `w` workspaces, `t` board, `i` task-manager tasks, `r` PRs, `d` lazygit, `a` orchestrator, `h j k l` move around, `?` Herdr help. The keys live in Herdr's config (`~/.config/herdr/config.toml`) and call `factory <command>`, so they run on the default hub unless the pane is inside another hub.
