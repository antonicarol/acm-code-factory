# Quality: gate, review, tests and design

Five independent checks; none of them is done by whoever wrote the code:

| Check | Who | Model | Blocks if |
|---|---|---|---|
| Gate | `factory gate` (script) | — | A repo check fails (types, lint, unit tests) |
| Code review | reviewer | per `routing` (Sonnet/Opus, medium/high effort) | Bug, broken repo rule, missing spec scenario, out-of-scope changes, unjustified `protected:`/`silenced:` |
| Repo suites | tester `suites` | Sonnet | An e2e test fails (after one retry) |
| On-screen test | ui-tester `ui` | Sonnet | A flow fails |
| Design | ui-designer `plan` / `critique` | Sonnet (effort high) | UI spec not followed, missing state, broken layout, accessibility failure, hard-to-find action |

## Gate

`factory gate <task> [repo…]` runs after the workers and before any reviewer or tester. Minutes, no tokens.

- **Checks** come from `workspace.json` → `gate.repos.<repo>.checks`, with `{base}` → `origin/<base>` (`gate.repos.<repo>.base`). They come from the hub, never from the branch: a worker cannot change what it is judged by. Typically types, lint and unit tests for the packages touched.
- **`protected:`**: existing files that match `gate.protected` (tests, lint/type/test configs) and that the branch modified or deleted.
- **`silenced:`**: added lines that silence a check (`eslint-disable`, `@ts-ignore`, `.skip`/`.only`).
- **`attention:`**: files that match `gate.attention.<label>` (migrations, `package.json`, CI/deploy, env). They don't judge anything: they go to "⚠ Needs attention" in `result.md` and to the PR, for a person.

`protected:` and `silenced:` don't make the gate fail: the reviewer accepts or rejects each one. It exits with 0 (all `PASS`), 1 (any `FAIL`) or 2 (usage error, or a repo with no gate config: that repo has no gate and its tester runs the full suites). Full output goes to `.board/gate/<task>/<repo>.log` (read by the worker, never by the coordinator) and a summary to `<repo>.txt`.

**Turns:** across the whole machine (all hubs) at most `GATE_SLOTS` (2) gates run at once; the rest queue for up to `GATE_WAIT` (40 min) and then run anyway, so a lost turn can't block a task forever. Running several gates at once doesn't finish sooner: they take CPU and memory from each other. Also set `--concurrency` on heavy checks: without it, turbo launches 10 tasks in parallel per gate. And use a shared cache (`--cache-dir="$HOME/.cache/turbo/<repo>"`): each task worktree starts without its own, so without it every gate re-checks everything from scratch; turbo indexes by content, so sharing it is safe.

**Example (a turbo monorepo):** `npx --no turbo run check-types lint --filter='...[{base}]' --concurrency=3` for the checks and the unit tests with `--concurrency=2 -- --maxWorkers=4`, set in the repo's `gate.repos.<repo>.checks`.

## Reviewer

Reads the plan and the diff of each folder (untracked files too) and the surrounding code. It applies:
- **Repo rules**: every `AGENTS.md` and `REVIEW.md` from the file's folder up to the root, the guides they link to, the repo's review skill if it has one, and the personal addition `~/.claude/rubrics/<repo>.md` if it exists.
- **Contract**: in multi-repo tasks, that both sides agree (endpoint, payload, names, types).
- **Lenses** according to the spec's surfaces, as a short list in the reviewer's own prompt: `security` → who can call each entry point, input validation, secrets, webhook signatures, errors without internal details (all of it blocks); `ui` → accessible names, keyboard and focus, and the loading / empty / error states the spec asks for (these block; the rest is optional). A diff that needs a lens the spec didn't include gets it anyway.
- **Over-engineering**: `ponytail-review`. The repo's structure conventions take precedence over "fewer files".
- **Gate lines**: each `protected:` / `silenced:` is accepted only if the plan asks for it and the test still checks what it used to check.

Writes the full report to `rounds/<N>/review.md` and returns `APPROVE` or `CHANGES NEEDED` with one line per blocking finding. Non-blocking items go to `Optional:` and don't change an `APPROVE`. It doesn't run suites (the gate already did, and the tester does). In **fix-round mode** it only checks that each earlier finding is fixed and reviews the delta.

## Tester and ui-tester

Always a fresh one per assignment. They never edit the repo; their scripts, logs and screenshots go to the directory they are given (`.board/shots/<task>/` in the on-screen test).

**Testing guide** = every `TESTING.md` from the app's folder (or the touched files') up to the repo root, plus the hub's in `testing/<repo>/` (at equal level the hub's wins) and the personal notes `~/.claude/testing/<repo>.md`. What they discover that the guide didn't say comes back as `guideNotes`, which the retro proposes adding.

| Agent · mode | When | What it does |
|---|---|---|
| `tester` | After the gate, one per repo; none if that repo's diff doesn't touch code that runs (only manifests, lockfile, type packages, docs or config no test reads), and it says so in `result.md` | Only the repo's e2e tests for what was touched, with its commands (those in `AGENTS.md` or the nearest manifest). In fix rounds, limited to the changed files. With no gate for that repo, the full suites. It doesn't start servers, except the front ends of its own task: in a worktree of a repo with `taskServers`, if an e2e needs them, `factory task-servers <task> start <app…>` and `stop` before reporting (if they were already up, it uses them and leaves them). |
| `ui-tester` `ui` | With an on-screen test plan, after implementation | Preflight, services (only the `autoStart: yes` ones from the guide), data and users by role; then one Playwright script per flow: console errors, responses ≥ 400, final screenshot (+ 390×844 if the change is UI) and the screenshots from the Capture list with `evidence.json` and crops. |
| `ui-tester` `capture` | Without an on-screen test, for the critique | Only the screenshots from the Capture list in `ui.md` at 390 and 1280, with measurements and crops. No flows and a single retry. |

Whatever the ui-tester starts by PID it stops before reporting; whatever it starts in the servers panel stays up until the coordinator stops it after the ship.

### Preflight

If the hub has the `ui-preflight` command (`<hub>/bin/ui-preflight`), the ui-tester runs `factory ui-preflight <task> <app…>` before anything else (and the coordinator once at the start, to ask you early): a script with no model that checks in seconds what used to cost agent rounds and prints `OK | WARN | FAIL` lines, without `.env` values. Without that command, the ui-tester checks the same things using the guide: front-end setup, which API it points at, browser, credentials, local services and backend branch.

A `FAIL` → `BLOCKED` with those lines verbatim as `needsUser`. The ui-tester doesn't investigate or retry on its own.

### On-screen test evidence

Everything lives in `.board/shots/<task>/` (the task's `recursos` panel, or `open .board/shots/<task>`):

| File | Contents |
|---|---|
| `<n>-<slug>.png` | Final state of each flow (`-fail`, `-mobile`) |
| `<task>-<capture>-…png` | Screenshots of each screen at its widths |
| `<task>-<capture>-<width>-crop.png` | Crop of the dialog/card at 2× |
| `<task>-<capture>-evidence.json` | Per width: boxes, `gap`, `radius` and `fontSize` of each measurement, horizontal overflow, axe violations, console errors and failed requests |

Screenshots are taken with the capture command named in the `ui` repo's testing guide, or with the ui-tester's own script in the same format when reaching the state takes clicks (a dialog, a menu, a tab). A measurement that finds nothing is a finding.

**Example:** a `capture.mjs` script in the front end's e2e package, which covers some apps and not the ones that need clicks.

## ui-designer

Product designer for tasks with a `ui` surface. **Never edits code**: it specifies what the worker builds and judges what was built.

### Sources (the first one wins)

1. The repo: `AGENTS.md`, its design guides (tokens, spacing scale, component priority) and, with Figma, whatever design flow the repo has.
2. What the product already does: the components of the repo's design system (their template, not just their props) and 2–3 neighboring screens of the same app.
3. `learnings/<repo ui>.md` in the hub.
4. The **impeccable** skill (pbakaus, Apache 2.0) as knowledge: `operate`, `harden`, `clarify` for planning; `critique`, `audit`, `craft-floor` for critiquing. Its interactive flow is not run.

It doesn't invent components, tokens or new styles. A component that renders badly with the props needed is not reused as is: it lays out its wrapper and notes it as a bug.

### `plan` mode → `ui.md`

At most ~60 lines plus the copy table. It covers what is seen; logic and data belong to the spec:
- **Job**: who arrives, in what situation, and what they must do.
- **Layout and hierarchy**: each row as **HUG** (its content), **FLEX** (the rest) or **FILL** (parent width) slots, and the gaps as tokens.
- **Wireframe**: ASCII drawing of each captured screen (desktop and 390 if it changes), with each control's variant.
- **Components**: element → component (`path`), props and variants. A lone action in a row is `outline`/`secondary` with an icon, never loose text.
- **States** (loading, empty, error, disabled, success, long text, many items), **copy** in the user's language, **responsive**, **accessibility**, **what to avoid**.
- **Capture**: 1–3 screens `name · app · route · role · state`, with 2–4 `measure name=selector` lines and `crop <selector>`.
- **Open**: product decisions with their default value.

The coordinator saves it as `ui.md` and gives it to the `ui` repo's worker, which builds exactly that; if something doesn't fit the code, it stops and says so.

### `critique` mode

Receives `ui.md`, screenshots after (and before), crops, `evidence.json` and the repo folder; writes to `rounds/<N>/critique.md`:
1. **Crops first**: small defects aren't visible at 1280.
2. **Control by control**: label and hint next to their control, looks interactive, aligned with the row's edges, same size as its siblings, wireframe followed.
3. **Measurements**: gaps on the system's scale and equal where the spec says equal, one radius per element type, `overflowX > 0` = broken layout, axe `serious`/`critical` = accessibility failure. It cites the measured value.
4. impeccable's heuristics (cognitive load, Nielsen) applied to the screenshots.

"It matches the spec" or "the neighboring screen does the same" don't excuse a broken layout: an inherited defect still blocks, marked `pre-existing`, with the local fix and the component fix as pending. It returns `APPROVE` or `CHANGES NEEDED`; blocking findings go to the `ui` repo's worker like the reviewer's.
