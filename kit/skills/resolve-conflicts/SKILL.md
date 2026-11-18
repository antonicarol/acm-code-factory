---
name: resolve-conflicts
description: How a coordinator resolves merge conflicts on its task's open PR — merge the base branch into the task branch, hand the conflicted files to the worker, review and test the resolution, then commit the merge and push. Load it when a `[pr-watch]` message says a PR conflicts with its base, or when the user asks to resolve the PR conflicts.
---

# Resolve conflicts on the task's PR

The PR is already open, so this authorizes one merge commit and a push to the **same branch** even when the ship mode is `off`. One PR at a time. The repo folder is the task's (`.tasks/<task>/<repo>`).

## 1. Confirm

```sh
gh pr view <n> --repo <owner/repo> --json mergeable,baseRefName,headRefName,url
git -C <repo> status --porcelain=v1
git -C <repo> branch --show-current
```

Stop unless `mergeable` is `CONFLICTING`, the current branch is the PR's head (the task branch from the proposal's Repos table) and the working tree is clean. A dirty tree is the user's: do not stash, reset or checkout. Say so and stop. An in-progress merge or rebase → stop and tell the user; do not start a second one.

## 2. Merge the base in

```sh
git -C <repo> fetch origin <base>
git -C <repo> merge origin/<base> --no-edit
```

`<base>` is the PR's `baseRefName` (the repo's `base` in `workspace.json` `repos`). This brings the base in. It does not rewrite the branch.

- **Already up to date** → GitHub has not refreshed. Say so and stop. Do not push.
- **Clean merge** (no conflict markers) → skip to step 5. The incoming commits are already on the base; do not re-review them.
- **Conflicts** → `git diff --name-only --diff-filter=U`. Continue.

## 3. Resolve

Send the conflicted files to the worker of that repo (`SendMessage`; the coordinator's reuse rules and its **Routing** for any fresh worker or reviewer: same worker, a fresh one only when its id is gone). The coordinator does not edit them.

The worker keeps **both** intents: the task's change and what landed on the base. It does not pick `--ours` or `--theirs` for the whole file to make the merge finish. Lockfiles (`yarn.lock`, `pnpm-lock.yaml`) and other generated files are regenerated with the repo's own command, not hand-merged. It `git add`s each resolved file and does not commit.

A conflict where the two sides disagree on behavior and the spec does not decide → the worker stops. Ask the user, in one message, and do not commit meanwhile.

## 4. Review and test

A fix round as in the coordinator's step 9, on the **resolution only** (the files from step 3, not the base commits that just arrived). A wrong resolution goes back to the worker. Still not ready after its rounds → stop and hand it to the user.

## 5. Commit and push

```sh
git -C <repo> commit --no-edit    # the default merge message; hooks run; never --no-verify
git -C <repo> push                # hooks run (front: ship skill, step 4); never --no-verify, never --force, never to the base branch
```

`--no-edit` keeps `Merge remote-tracking branch 'origin/<base>'`, which commitlint ignores. If a hook still rejects it, commit with `chore: merge <base> into <branch> (<ticket>)` (no ` (<ticket>)` when the task has no ticket, ≤ 100 chars) and retry once. A push rejected because the branch moved → fetch and run this skill once more. Still failing → stop and report it.

Then `gh pr view <n> --repo <owner/repo> --json mergeable`. `MERGEABLE` → done. `UNKNOWN` → say it was pushed and GitHub is still computing. `CONFLICTING` → the resolution missed a file; back to step 3 once.

## 6. Report

Add to the task's `result.md` (change folder, or `briefs/<task>/` for a lite task) under "Conflictos": the PR URL, the base merged, the files resolved and anything left for the user. Tell the user in a few lines.

## Never

Rebase, amend, force-push, push to the base branch, stash or reset, resolve with `--ours` / `--theirs` for a whole file, commit a resolution the reviewer has not approved, or touch a PR that is not this task's.
