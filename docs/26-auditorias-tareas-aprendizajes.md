# Audits, task manager and learnings

## Auditor

A separate session (`factory audit-start <repo> <type> [scope]`, or by asking the orchestrator) in the `audit · <repo>` or `review · <repo>` workspace. It never modifies the audited repo or runs its code.

| Type | What it does |
|---|---|
| `security` | Cloudflare's `security-audit` skill in full mode: reconnaissance, parallel hunters, independent verifiers and validators in Node. Anything that would need to run code is left as `needs_validation`. Profile and budget: `claude.auditProfile` / `auditBudget` (`quick`, 12 agents); `AUDIT_PROFILE=deep` for a single pass. It is expensive. |
| `quality` | `ponytail-audit` (over-engineering) + the repo's rubric (`REVIEW.md`, its guides, its review skill) with scouts per area + test gaps in critical code (without running them). |
| `review` | Review of a specific target (paths, PR `#123` or branch): performance, repo rules, bugs, basic security and simplification. It reads the PR or branch without checking it out. |
| `all` | `security` + `quality` |

Result: `audits/<repo>/<date>-<types>/REPORT.md` (in the user's language, prioritized, with `path:line`) and `findings.json`. It then offers to create tasks (task-creator, if there is a task manager) or to hand the findings to the orchestrator as a new task.

`audit-start` requires a git repo and a Herdr session. To audit the hub itself (which may not be a repo with history), use parallel reviewers from a normal session.

## Task manager: Jared and task-creator

The task manager is optional and pluggable. Without `tracker` or `notion` in `workspace.json`, tasks come in through the chat or `factory task`, and the orchestrator offers to jot ideas down in `BACKLOG.md`. With one, the orchestrator loads that tracker's adapter (`trackers/<type>/TRACKER.md`, see [`trackers/README.md`](../trackers/README.md)) to read tickets and move their status. Notion is the adapter that ships: `factory notion-page` reads tickets, the `notion` panel lists your tasks, and Jared creates new ones. Another tracker (Linear, Jira, GitHub Issues…) is a `TRACKER.md` with four operations, written in your hub; it can also just write to `.board/inbox/`.

**Jared** (Sonnet, workspace `jared`) is the task-creation coordinator, separate from the orchestrator so you can talk to him on his own. The orchestrator hands him requests (`.board/jared/<date>.md` + `factory jared`).

1. **Draft**: calls `task-creator` in `mode: draft` (one per independent need).
2. **Shows** per task: title, project, type, priority, SPs, links between tasks, checklist items that fail and duplicates found; then the questions.
3. **Edits** with you and **creates** only after your explicit "yes" (`mode: create`). "Save it" → draft in `personal/drafts/`.
4. Optional: "tell the orchestrator to start `<ticket>`" → `factory task "Start <ticket>"`, which reaches this hub's orchestrator and not another one open in Herdr.

He also updates existing tasks (`mode: update`, showing `field: before → after`) and creates tasks from your personal backlog (`personal/backlog/*.md`), marking the item as planned afterwards.

**task-creator** (Sonnet) applies the team's guide (skill `tech-task-creator`, which re-reads the guide in the task manager every time): it looks for duplicates, reads the real code for routes and endpoints, and doesn't set an assignee, sprint or status unless given one. It never deletes pages or creates anything without an approved draft. It is used by Jared, the coordinators (for follow-ups) and the auditor.

## Learnings: retro and `learnings/`

The factory improves task by task by saving, in each hub, what was costly to discover. The bar is "without this, the next task here would lose a round".

```
task → retro (candidates) → your "yes" per item → learnings/<repo>.md · learnings/workflow.md · testing/**/TESTING.md
                                                      ↓ confirmed and stable
                                               the repo's AGENTS.md · context/
```

- **Candidates**: what had to be discovered, wrong assumptions that cost a round, documentation lines that turned out to be false, your corrections and the testers' `guideNotes`. Left out: what can be read in the code or the spec, and what only mattered to this task.
- **Format**: a line of up to 200 characters, `date · type · text · task · author`, with type `trampa`, `hecho`, `receta` or `cómo trabajamos`, in the section for the service or app.
- **Approval**: at most 5 candidates, ordered by the round they would save; only what you approve is written. A wrong guide line is fixed in place, not supplemented with another.
- **Who reads them**: coordinator and specker before planning (the section for what the task touches), the ui-designer (the `ui` repo's section) and the workers, through the coordinator.
- **Never**: secrets, tokens, real personal data or absolute paths of the machine.

What holds for any project (not for one repo) doesn't go in the hub's `learnings/`: it's an engine change.
