---
name: ship
description: How a coordinator delivers a verified task — commit only the task's files, push the task branch and open one PR per repo in the team's format (title, body with the ticket link, manual QA as "How to test"). Load it at the end of a task when the ship mode in your first prompt is not `off`.
---

# Ship a verified task

Ship only when the task is **VERIFIED** (reviewer `APPROVE`, testers `OK`), or when the only blocker is the UI test and the user said to ship without it (keep `Status: BLOCKED` in `result.md` and say so in the PR's Notes). Manual QA never blocks shipping: it goes in the PR as "How to test". The **ship mode** came in your first prompt (from `workspace.json` `ship`):

| Mode | What you do |
|---|---|
| `off` | Nothing. Say it is ready for the user to commit and open the PR. |
| `ask` | Prepare everything (steps 1-3), show per repo: files, commit message, PR title and body. Wait for the user's yes in this pane, then do steps 4-7. |
| `draft` / `ready` | Do every step without asking; open the PR as draft or ready for review. |

Per repo of the task (repo folders in `.tasks/<task>/`); with several repos, ship the backend first so the front PR can link it.

## 1. Check the branch
- `git -C <repo> branch --show-current` must be the task branch from the proposal's Repos table. Anything else → stop and tell the user.
- Read the repo's git rules first: its `AGENTS.md` and git/delivery guideline (e.g. `.agents/guidelines/git-workflow.md`). They win over this skill.

## 2. Pick the files
- Commit **only the files this task changed**: the union of the workers' "files changed" reports, checked against `git -C <repo> status --short`.
- The folder may be the user's main checkout: a changed or untracked file the workers did not report is **theirs**. Leave it out and mention it. Never `git add -A` / `git add .`, never stash, reset or checkout.
- Never commit `.env*`, credentials, logs, screenshots or scratch files.

## 3. Write the commit and the PR
- **Commit / PR title** (conventional commits, enforced by commitlint): `<type>(<scope>): <what changed, lower case> (<ticket>)`; without a ticket, no ` (<ticket>)`. `type`: `feat`, `fix`, `chore`, `docs`, `ci`, `revert`. `scope`: the app or service (`web`, `billing-service`). ≤ 100 chars, no final full stop. One commit per repo is fine; the body (optional) explains *why*.
- **PR body** (English, like the team's PRs; write it to a temp file):
  ```md
  ## ⚠ Needs attention
  - One line per item of result.md "⚠ Needs attention", in English, with its file. Omit the section when it says "Nothing".

  ## Summary
  [<ticket>](<ticket url>): one sentence on what the user gets. (No ticket: just the sentence.)

  - What changed, by area: endpoints with method/path and payload, components, composables, i18n keys…
  - Contract or behaviour decisions worth knowing.

  ## How to test
  1. Manual QA steps from result.md, numbered, with user role and expected result.

  ## Notes
  - Related PRs in other repos (link), dependencies not merged yet, follow-ups, known gaps.
  ```
  The ticket URL is the `**Ticket**:` line of the proposal (or of the brief, for a lite task). Do not paste the plan, the review or test logs.

## 4. Commit and push
```sh
git -C <repo> add <file> [<file>...]
git -C <repo> commit -F <msgfile>          # hooks run; never --no-verify
git -C <repo> push -u origin <branch>      # hooks run; never --no-verify, never --force, never to the base branch
```
A failing hook → read it; if it is code, a fix round as in the coordinator's step 9 with the hook's output as the finding, and commit only once it is ready; retry once. Still failing → stop and report it. A pre-push hook that builds and tests the whole repo can take minutes: run the push in the background (Bash `run_in_background`) and wait for its notification. A test timing out in code the diff does not touch is load, not the task: push again once.

## 5. Open the PR
```sh
gh pr create --repo <owner/repo> --base <base> --head <branch> --title "<title>" --body-file <bodyfile> [--draft]
```
- `<base>` from the Repos table (`workspace.json` `repos.<repo>.base`). Never anything else.
- If a PR for the branch already exists (`gh pr list --head <branch>`), push only and report its URL.
- If the repo's guideline says how to wake its review bot when it does not start (e.g. comment `@coderabbitai review`), do it.

## 6. UI screenshots (front PRs with a `ui-tester` run)
Images never go in the task branch. They go to the repo's `pr-screenshots` branch (only images, one folder per PR and run) and the PR gets one comment that shows them.
1. Pick few images; the comment must read in seconds. Per capture: its screenshot at the widest width (from the `ui-tester`'s `captures`; add the 390 one only when the change is about mobile). Flow screenshots only for a flow that failed, or one showing a state no capture shows (at most 2). At most 8 images in total. Look at each before publishing: no tokens, credentials or real personal data.
2. Publish them with `factory pr-shots <repo> <pr number> <images...>`: it uploads them to the repo's `pr-screenshots` branch through the GitHub API (no checkout, no push, so no hooks to skip) and prints one `url <file> <raw URL>` line per image. Never push that branch with git.
3. Comment on the PR with `gh pr comment <n> --body-file <file>`: `### UI test` and the environment in one line; per capture `**<capture>**` and its image; then the flows as a list `- ✅|❌ <n>. <title>` with no images (the few flow screenshots picked above go under their line); last, one line `Not run: …` if any. Image URLs: the ones `pr-shots` printed.
4. Put the comment URL in `result.md` under "On-screen test". Shipping again after a fix round: a new run folder and a new comment.

## 7. Report
Add the PR URLs to `result.md` (`- PR: <url>` under each repo) and tell the user. With a tracker, the orchestrator moves the ticket to `Review` when every repo has its PR. Do not ask the reviewer bots for anything else: `pr-watch` tells you when their comments land, and you handle them with the `factory:review-loop` skill.

## Never
Merge, approve, force-push, push to the base branch, rebase or amend published commits, skip hooks, or open a PR when the task is not VERIFIED (except the UI-test case above, with the user's yes).
