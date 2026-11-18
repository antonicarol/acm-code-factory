# Spec and plan

## Spec: the specker

The specker (Sonnet) writes a task's spec. It doesn't talk to you: the coordinator shows you its summary and forwards your answers back (`SendMessage`) so it updates what it wrote. It writes only in the hub. If the request says something fails (a check, a test, a bug), it first reproduces it on the base branch; if it doesn't happen there (e.g. it only exists in uncommitted files in your checkout), it says so at the very top instead of specifying a fix.

### Full or light?

`workspace.json` `openspec`: `always` → full, `never` → light, `auto` (default) → the specker decides:

| Full (OpenSpec) if **any** | Light if **all** |
|---|---|
| More than one repo | One repo |
| New or changed behavior worth remembering (endpoint, event, contract, business or permission rule, new feature) | Bug, copy/i18n, styles, config, small refactor, dependency bump, tweak |
| Large (≈5 SP or more, many files) | No contract change |
| Ambiguous requirements that need decisions in writing | The scope fits in 1-3 sentences |

When in doubt, full.

| | Full | Light |
|---|---|---|
| Where | `openspec/changes/<task>/` | `briefs/<task>/brief.md` |
| Files | `proposal.md` (Why, Ticket, Repos table, Contract, Decisions, Risk), `specs/<capability>/spec.md` (requirements with scenarios), `tasks.md` (one group per repo) | Why, What, Repos, Decisions, Risk, Done when, Manual QA |
| Validation | `openspec validate <task> --store <store>` | — |
| On close | Archived and its requirements move to `openspec/specs/` | Moved to `briefs/archive/` |

Each hub is its own OpenSpec *store*: its id is in `<hub>/.openspec-store/store.yaml` (created by `factory hub-init`); `task-start` passes it in the coordinator's first message, which passes it to the specker. The schema is `factory` (`openspec/schemas/factory`, copied into the hub). Each hub's rules go in its `openspec/config.yaml`; the template's: prose in English, never commit/push/PR or manual QA tasks in `tasks.md` (manual QA goes in the proposal and from there to `result.md` and to the PR's "How to test").

### What it reads before writing

The hub's `AGENTS.md` (repos, branches), `context/`, `learnings/<repo>.md` and `learnings/workflow.md`, each repo's `AGENTS.md` and the repo guides that affect the change. From the code, only what it needs to be concrete: real endpoints, permissions, events and routes. It doesn't invent a name it hasn't read; if it couldn't confirm one, it says so.

### Risk and routing

Every spec has a **Risk** section: `- Risk: <level> — <reason>` and `- Surfaces: <list>`. It measures what the change can break, not its size:

| Level | When |
|---|---|
| `high` | Payments, prices, subscriptions or webhooks; auth, roles, permissions or who sees what data; a migration that changes or loses data; breaking a contract other repos depend on; deploy, CI or infra |
| `medium` | New behavior: a new endpoint, event, business rule, screen or flow; an additive migration |
| `low` | A local bug, a small refactor, a tweak, config with some logic |
| `tiny` | A mechanical change with no logic: texts, a style token, a constant, a rename in one place |

Surfaces: `ui` (changes what a user sees in a `ui` repo) and `security` (auth, permissions, payments, webhooks, secrets, user input that reaches a query, a shell or HTML). A surface doesn't raise the level: it adds a lens for the reviewer.

The coordinator reads the level and takes that row of `workspace.json` → `routing`: worker model (`worker`), reviewer model and effort (`reviewer`, `reviewerEffort`) and, if the row says so, `planApproval`, which overrides `approvals.plan`. With no Risk section, `medium`. It tells you in one line (`Risk high · ui, security → worker opus, reviewer opus/high, plan: ask`). If it thinks the level is wrong, it uses another and says why. On `tiny`, if its cheap worker fails the gate or the review, the fix goes to a new worker with the `low` model.

### Answer and approval

It returns: full or light and why, the risk with its reason, the path, the summary (what changes per repo, contract, scenarios), the decisions made and numbered **Questions**, each with its default. Each default is written into the spec as "Decision (default, unconfirmed): …", so the result and the PR show what was assumed.

| `approvals.spec` | What the coordinator does |
|---|---|
| `ask` | Waits for your "yes"; your answers go to the same specker |
| `auto` | Carries on with the defaults, except for a product decision with no reasonable default |

If, while planning a light task, it turns out not to be one (it changes a contract, it's much bigger), the coordinator stops, tells you, and with your "yes" the specker turns it into a full one.

"Spec only": if you ask the orchestrator for it, it calls the specker itself without starting the task; `task-start` later picks up the change or brief already written.

## Plan: the coordinator

The plan is written in the coordinator's pane, per repo: files, changes, the shared contract, how to verify and a **Rules** line with the repo guides that apply (passed to the worker and the reviewer). It is fed by:
- **Scouts** (Haiku), at most `claude.parallel` at a time, with concrete questions.
- **ui-designer `plan`**, if the surface includes `ui` → `ui.md` next to the spec ([Quality: gate, review, tests and design](24-calidad.md#ui-designer)).
- **On-screen test plan**, with `uiTests: on` and code in a `ui` repo touched: environment (`uiEnv`), numbered flows (role, URL, steps, expected result), screenshots (screen, app, route, user, state, widths and measurements from `ui.md`) and realistic data, because they end up in the PR. It is written after reading the `testing/<ui repo>/**/TESTING.md` guides. A task without a `ui` repo has none: its endpoints are covered by the suites and screen checks go to "manual QA".

| `approvals.plan` (or `planApproval` from the routing row) | What the coordinator does |
|---|---|
| `ask` | Waits for your "yes" in its pane |
| `auto` | Starts implementing; doubts are left as "Decision: …" and it stops only for what the team can't do without you (credentials, human actions, data it can't find) |

If the plan changes scope or contract, it updates `proposal.md` / `tasks.md` and validates. During the task it ticks `tasks.md` (`- [x]`) after each verified step.

## `result.md`

The coordinator writes it when done, in English, next to the spec:

```md
# <task> · result
- Status: VERIFIED | FAILING | BLOCKED
- Rounds: n (reports in `rounds/`)
## ⚠ Needs attention    high risk, attention:/protected:/silenced: from the gate, default decisions; or "Nothing"
## Per repo             changes, verification (commands and result), PR
## Adjustments          what you asked for during the task
## On-screen test       environment, flows ✅/❌ with their screenshot, diffs, link to the PR comment
## Manual QA            steps to test by hand (they go to the PR's "How to test")
## Pending              what's missing, what wasn't tested, decisions for you
```

The orchestrator summarizes it when it appears, and the review-loop adds "PR review".
