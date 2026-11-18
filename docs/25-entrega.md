# Delivery and follow-up

## Ship (skill `factory:ship`)

Only with the task `VERIFIED` (or `BLOCKED` by the on-screen test and with your "yes"). The mode comes from `workspace.json` `ship`:

| `ship` | What it does |
|---|---|
| `off` (default) | Nothing; tells you it's ready for you to commit and open the PR |
| `ask` | Prepares commit and PR per repo, shows them to you and waits for your "yes" |
| `draft` / `ready` | Commit, push and PR as a draft or ready for review |

Per repo (the `api` one first, so the `ui` PR can link to it):
1. **Branch**: it must be the one in the spec's Repos table; otherwise it stops. The repo's git rules take precedence over the skill.
2. **Files**: only those the workers said they changed, cross-checked with `git status`. Everything else is yours and stays out. Never `git add -A`, `.env*`, logs or screenshots.
3. **Commit and PR messages**: conventional commits, `<type>(<scope>): <what> (<ticket>)` (no ticket, no parentheses). The PR body is in English: *Needs attention* (what's under "⚠ Needs attention"), *Summary* (with the ticket link), *How to test* (the manual QA from `result.md`) and *Notes*.
4. **Commit** with hooks (never `--no-verify`). A hook that fails because of the code goes back to the worker, a fresh reviewer and the suites before retrying.
5. **Push** with hooks (never `--no-verify`). If the repo's pre-push is long, it runs in the background.
6. **PR** against `repos.<repo>.base`. If one already exists for the branch, just push.
7. **Screenshots** (`ui` repo with an on-screen test): up to 8 images (one per captured screen) that `factory pr-shots` uploads to the repo's `pr-screenshots` branch through the GitHub API (no `git push`, so there are no hooks to skip) and a PR comment with the before/after table and the ✅/❌ list of flows.

It never merges, approves, force-pushes, pushes to the base branch or rewrites published commits.

## pr-watch

`factory pr-watch` starts with the orchestrator (one instance per hub) and polls GitHub every 2 min using only `gh`. It reads the branches in the Repos table of each active task.

| Detects | Notifies | Result |
|---|---|---|
| PR open in all of the task's repos | orchestrator | With a task manager: ticket → `notion.status.pr` |
| All PRs merged | coordinator · orchestrator | `factory task-end` (the coordinator; the orchestrator only if the coordinator is gone) · ticket → `notion.status.merged` |
| New review threads or a new review from a bot in `reviewLoop.bots` (stable across two polls) | coordinator | skill `review-loop` |
| PR in conflict with its base | coordinator (once; again if it comes back) | skill `resolve-conflicts` |
| Red CI | coordinator (once per failure) | fix round if it's the code's fault; otherwise it tells you |

The ticket never moves backward (the position in `notion.order` is compared). Without a `notion` key, pr-watch still notifies and nothing is moved. Before waking a coordinator that is no longer working and whose context is over ~100k tokens, it compacts it (`/compact` in Claude, `/summarize` in Cursor): the task's state is on disk.

## Review comments (skill `factory:review-loop`)

1. Reads the unresolved threads and what review bots leave in the body of their review (via `gh api graphql`). A thread is answered when its last comment carries `<!-- factory -->`, the invisible signature of the coordinator's replies. The author isn't checked: the coordinator comments with your GitHub user, so your own comments on your PR count as pending.
2. Classifies each one: **fix**, **reject** (with the reason in a sentence or two) or **for you** (a product decision, or a comment from a person it can't settle).
3. Your comments (those from the `gh` user) are your assignments: it fixes them without asking, or answers them if they're a question. For the rest, `reviewLoop.fixes` decides what it fixes without asking: `auto` everything, `bot-auto` only what comes from bots, `ask` (default) shows the classification and waits.
4. Runs the fix round with the normal loop (the coordinator's fix round: worker → gate → reviewer → tester, and `ui-tester` if it touches a `ui` repo) and pushes to the same branch: `fix(<scope>): address review comments (<ticket>)`.
5. Replies in each thread (`Fixed in <sha>: …` or the reason) and resolves according to `resolveThreads` (`bot-only`, `all` or `none`, the default).
6. Records the round in `result.md` → "PR review". After `reviewLoop.rounds` rounds (3 by default), it hands the rest over to you.

The PR is ready to merge when no thread is pending and CI is green. You do the merge.

## Conflicts (skill `factory:resolve-conflicts`)

Merges the base into the task branch (never rebase or force-push), hands the conflicting files to the worker, reviews and tests the resolution, and commits the merge and pushes.

## Retro (skill `factory:retro`)

After the ship, the coordinator gathers what was learned: pitfalls, facts the guides lacked or had wrong, data recipes, the tester's `guideNotes`. It proposes them to you **one by one** and writes only what's approved, as a line with date and task in `learnings/<repo>.md`, `learnings/workflow.md` or the testing guide. What's confirmed can be promoted to the repo's `AGENTS.md` or to `context/`. Any kit session can launch it with `/factory:retro`.

## Closing: `factory task-end`

With the PRs merged, the task's coordinator runs it (notified by `pr-watch`). If the coordinator is gone, the orchestrator does it:
```sh
factory task-end <task>              # archives the change; its requirements move to openspec/specs/
factory task-end <task> --discard    # discarded: archives without touching openspec/specs/
```
It stops the task's servers, removes worktrees (git refuses if there are uncommitted changes) or links, archives into `openspec/changes/archive/<date>-<task>/` (or `briefs/archive/`) and closes the Herdr workspace by its id.
