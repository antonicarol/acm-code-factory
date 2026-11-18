# Your first task

A task goes from a request in your own words to a reviewed and tested PR. For the first one, pick something small that you can check by eye: a text, a new field, a bug with clear steps.

## 1. Ask for it

From any terminal:

```sh
factory task "On the profile screen, the Save button doesn't disable while the form is being submitted and can be clicked twice. Disable it until the API responds."
```

Or write it in the orchestrator's chat. Say **what** and **why**; the task decides how. If you know the repo, add it at the end as a hint (`factory task "…" web`).

## 2. The orchestrator launches it

It decides the repos and the branch, and runs `factory task-start`. A **new Herdr workspace** appears with the task's name: inside, its **coordinator** on the left and the task panel on the right.

## 3. Approve the spec

The **specker** reads the code and writes the spec: what changes, how it is checked and the **risk** (`tiny`, `low`, `medium`, `high`). The coordinator shows you a summary with decisions and questions in its pane.

Answer there: "yes", or whatever you want changed. With `approvals.spec: ask` it doesn't continue without you.

## 4. Approve the plan

The coordinator sends **scouts** to look at the code and writes the plan per repo, with each repo's rules. It shows it to you and waits for your "yes" (`approvals.plan: ask`).

## 5. Watch it being built

You don't have to do anything. In the task panel:

- **agentes**: the subagents in order. **Workers** that implement, the **gate** (your checks), the **reviewer** that reads the diff, the **testers** that run the e2e tests and, if there is a screen, the ui-tester with its screenshots.
- **cambios**: the diff per repo. `ctrl-n` jots a note on a line and `ctrl-s` sends them to the coordinator as adjustments from you.

If something doesn't pass, it goes back to the same worker. At most 3 rounds.

## 6. Result and PR

When finished, the coordinator writes `result.md` next to the spec: status (`VERIFIED`, `FAILING` or `BLOCKED`), what changed, what needs your attention and the manual QA that remains. With `ship: ask` it asks you whether to create the PR; with `draft` or `ready`, it creates it on its own.

## 7. After the PR

`pr-watch` watches the PR every 2 minutes. Review comments, a conflict with the base or red CI go back to the coordinator, which handles them. When the PR is merged, the task closes itself (`factory task-end`) and its workspace is closed.

## If something goes wrong

| You see | Do |
|---|---|
| The task's workspace doesn't appear | Check the orchestrator's chat; `factory task --list` shows what is waiting in the inbox |
| `GATE FAIL` on every round | Run the check by hand on the base branch: if it fails there, fix it first or remove it from `gate` |
| `BLOCKED` | The coordinator says what is missing (a server, docker, data). Fix it and tell it in its pane |
| You want to stop it | Tell the coordinator; to discard it: `factory task-end <task> --discard` |

What happens inside, phase by phase: [Task lifecycle](21-ciclo-de-una-tarea.md).

Next: day to day.
