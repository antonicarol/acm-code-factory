---
name: tech-task-creator
description: Rules for creating Engineering Tasks in Notion (the team's task guide). Loaded by the `factory:task-creator` agent only. Main sessions do not use it: the orchestrator hands task creation to Jared (`factory jared`), coordinators and the auditor call `factory:task-creator`.
---

# Tech task creator

Source of truth lives in Notion; read it every time, do not work from memory:

1. Read the team's task guide pages (how to create an Engineering task, the work methodology and the TDD guide), linked from the hub's `AGENTS.md` or `context/`. The other pages the guide links (cross-team dependencies, principles, infrastructure) only when the task touches them.
2. Make sure you have all the context needed. If not, ask before creating anything.
3. Always write tasks in English.
4. Always add new tasks at the bottom of the Engineering Tasks database (data source: `notion.tasks` in the hub's `workspace.json`).

## Before creating

- Show the list of tasks (title, project, priority, SPs, assignee) in chat and wait for an explicit go-ahead. A request to "break down" or "see" tasks is not a go-ahead.
- Title: `[Service/Project] — Imperative verb + what`, under 80 characters (e.g. `[Payments] — Add retry logic for failed webhook deliveries`).
- Every task needs a Project from the Projects database. If none fits, ask whether to create one.
- Every task needs a `Type` (relation to the Types database): Bug, Feature, Documentation or Hotfix, as the guide defines them.
- Work that spans several repos (e.g. a backend endpoint and the screen that uses it): one task per Project, linked with `Blocked by` / `Blocking` (the consumer is blocked by the provider), each one stating the shared contract.
- Propose Priority and SPs yourself (guide's Fibonacci scale), with one line of reasoning each, for the user to confirm.
- 13 SPs or more: propose a split instead of creating it.
- Initiative: only the engineering team's initiatives. `Release` from the Initiative's `Active Release`: exactly one → set it; `—` → leave empty; `⚠️ N active` → leave empty and flag it to the user.

## Body

The sections and their order come from the guide: Summary (callout), Context, Acceptance Criteria, Test Cases / TDD Scenarios, Technical Notes, Dependencies & Blockers, QA Notes, plus API Contract, Feature Flag and Related Tasks when they apply. Use real repo paths, endpoints and field names, read from the code. Repository links in Context and Technical Notes are the GitHub URLs from the task's Project page (Projects database), never local paths alone.

## Test users in QA Notes

QA Notes say **who** runs each check, so a person or the UI tester agent can start without asking. Read the testing guides for the environments and the users per role: in the hub, `testing/<repo>/TESTING.md` and `testing/<repo>/apps/<app>/TESTING.md` (kept there for now), plus the repo's own `TESTING.md` files. For every scenario state:
- **Environment**: demo, or the local stack when the task changes the backend or needs a user that only exists locally (the guide's rule).
- **User**: the role and the existing test account for it from the guide (e.g. `qa-student` on demo, `admin@example.com` admin profile locally).
- **Permissions** the check relies on (e.g. `live-events.produce`), when the role alone does not make it obvious.
- **No account fits** (a new permission, a role or state no persona has) → say so explicitly: which user is needed, with which permissions or state, and how to create it (a new persona in the test fixtures registry, a seed in the backend, or by hand). List it under Dependencies & Blockers, since the check cannot run until it exists.
- **No user needed** (a public page, a lead without an account) → say that.
