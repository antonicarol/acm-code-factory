---
name: ui-test
description: How a coordinator handles the screen side of a task — the UI spec (ui-designer `plan`), the UI test plan, the `factory:ui-tester` runs, the ui-designer `critique` and when such a task is ready. Load it at the plan step when the spec's Surfaces include `ui` or the task changes code of a `ui` repo.
---

# The screen side of a task

The coordinator's Flow still applies; this adds to its steps 3, 4, 7, 9 and 12. **UI tests** (`on | off`) and **UI env** (`demo | local`) come from your first prompt (`workspace.json` `uiTests`, `uiEnv`; the user can switch UI tests for this task in the pane). The UI env is the user's standing decision: never ask which environment, never offer the other, never ask the user to edit an env file.

## Step 3 · UI spec

When the spec's Surfaces include `ui` (the task changes what a user sees in a `ui` repo: a screen, a component, a state, copy; not a BFF route, a store or logic only): one `factory:ui-designer` in mode `plan`, launched with the scouts, with the front folder, the app, the change/brief path and any Figma link. Write its answer to `ui.md` next to the spec (`openspec/changes/<task>/` or `briefs/<task>/`), summarise it in the plan, and give its path to the front worker as part of its plan: the worker builds that UI, it does not design its own.

## Step 3 · UI test plan (UI tests `on` and the task changes front code)

A task without a `ui` repo has none, even if a screen consumes its endpoints: the backend's own suites cover them and the screen checks go to "Manual QA" ("On-screen test": "Not applicable (backend only)"); never ask the user to set up a local front for it. With UI tests `off`: no plan and no `ui-tester`; "On-screen test" says "Desactivada" and "Manual QA" carries every flow.

Write it from the spec's scenarios and the task's QA notes, after reading the front's testing guides: the hub's `testing/<ui repo>/TESTING.md` and `testing/<ui repo>/apps/<app>/TESTING.md`, plus the repo's own `TESTING.md` files.
- **Environment**: the UI env. On demo, a flow that needs backend code not deployed there yet (this task's own backend change) cannot pass: move it to "Manual QA" with that reason and test the rest.
- **Flows**, numbered: role (the guide's user for it), URL, steps, expected result. Cover each acceptance scenario; add the error or empty state when the spec has one.
- **Capture**: the screens whose look changes (short name, app, route, role, state to reach), usually 1–3; one width unless the change is about mobile. With a `ui.md`, take its Capture entries with their `measure` lines.
- **Data**: realistic content, since it ends up in the PR: questions, polls and names that fit the product, made by the role that would make them. No ticket numbers, "test" or Alfa/Beta in visible text; on demo, the fewest items the flows need.

## Step 4 · Surface what only the user can do, early

When the hub has `<hub>/bin/ui-preflight`, run `factory ui-preflight <task> <app...>` yourself while the workers start (seconds, no agent). Its `FAIL` lines are for the user (start docker, switch the backend, create data): ask them in one message, even with plan approval `auto`. The workers do not wait for it.

## Step 7 · Test on screen

Within the coordinator's cap, alongside the reviewer and the `suites` tester:
- **UI test plan** → one fresh `factory:ui-tester` in mode `ui` with the plan, the UI env, the front folder, its branch, the task name, the scratchpad dir `<hub>/.board/shots/<task>/` (absolute: the user opens it while the task runs) and the hub's absolute path. It brings up what the flows need, runs them and takes the Capture screenshots. Its `needsUser` items go to the user in one message; run it again once they answer. **One retry only**: still `BLOCKED` after the user's answer → stop chasing the environment: the flows go to "Manual QA", "On-screen test" says `Bloqueada:` plus the FAIL lines, and the rest of the task goes on.
- **`ui.md`** → once the screenshots exist: one fresh `factory:ui-designer` in mode `critique` with `ui.md`, the capture PNGs, their `-crop.png` and `evidence` paths, the front folder and its critique file `rounds/<N>/critique.md`. No `ui` run (UI tests off, or a task with only a Capture list) → first one `factory:ui-tester` in mode `capture` with the Capture list of `ui.md`, the UI env, the front folder, its branch, the task, the same scratchpad dir and the hub's path; `capture` `BLOCKED` → no second try: the critique reviews the diff only and says so. Verdict `APPROVE` or `CHANGES NEEDED`; its blocking findings go to the front worker like the reviewer's, its optional ones under "Pendiente".

## Step 9 · Ready, and fix rounds

- Ready also needs the `ui-tester` `OK` (when there is a UI test plan) and the critique `APPROVE` (when there is a `ui.md`).
- A task that changes front code is never ready on `suites` alone: if `ui` could not run, it is `Status: BLOCKED` with the reason as the first pending item, and it is not shipped unless the user says to ship it without the UI test (ask once, at the ship step).
- In a fix round: `ui` again when the round touched front code, then a fresh critique with its previous `critique.md` (a new one in the same round folder) when it had blocking findings.

## Step 12 · After shipping

The `ui-tester` reports services it started in the user's servers panel (`started … still up`). After the ship (or when you stop), stop each with `factory servers stop <name>`; never one it reused.

`result.md` → "On-screen test": environment, per flow number, title, user, ✅/❌ and the path of its final screenshot; per capture its path.
