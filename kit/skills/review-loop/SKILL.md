---
name: review-loop
description: How a coordinator handles review comments on its task's open PR — read the review threads and review bodies of the reviewer bots (CodeRabbit, claude) and of people, triage each one, fix the valid ones through worker → reviewer → tester, push to the same PR, reply to every thread and resolve per config, until nothing is pending. Load it when a `[pr-watch]` message says there are new review comments, or when the user asks to handle the PR comments.
---

# Review loop on the task's PR

Settings come from the hub's `workspace.json` → `reviewLoop` (two levels up from your working directory): `fixes` (`auto` | `ask` | `bot-auto`), `resolveThreads` (`bot-only` | `all` | `none`), `bots` (logins), `rounds` (max fix rounds per PR, default 3). No `reviewLoop` key → behave as `fixes: ask`, `resolveThreads: none`.

## 1. Read what is pending (per PR of the task)

```sh
gh api graphql -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){pullRequest(number:$n){
  reviewThreads(first:100){nodes{id isResolved isOutdated comments(first:20){nodes{author{login} body path line url}}}}
  reviews(last:20){nodes{author{login} state body submittedAt}}}}}' -F o=<owner> -F r=<repo> -F n=<number>
```
- **Pending** = threads with `isResolved: false`, plus the "Nitpick comments" / "Outside diff range" items inside the latest review **body** of each bot (CodeRabbit puts them there, not in threads).
- A thread whose last comment is a factory reply (contains `<!-- factory -->`: answered, waiting for them) is not pending. Do not go by login: you post as the user's GitHub account, so a comment of the user on their own PR has your login and **is** pending. (A reply of yours from before the marker existed, `Fixed in <sha>: …` or a decline, also counts as answered.)

## 2. Triage each item

| Verdict | When | What happens |
|---|---|---|
| **fix** | Correct and in scope (a bug, a broken repo rule, a cheap clear improvement) | goes to the fix round |
| **decline** | Wrong, out of scope, or against the repo's conventions / the plan | reply why, in one or two sentences |
| **for the user** | A product decision, or a person's comment you cannot settle from the code | ask the user, in one message with all of them |

A comment by the user themselves (author = `gh api user --jq .login`, without the marker) is the user's own request: **fix** it without asking, whatever `fixes` says, unless it is a question; then answer it in the thread.

`fixes` decides what you may fix without asking: `auto` = all **fix** items; `bot-auto` = bot items only (people's go to the user); `ask` = show the triage and wait for the user's yes. Nitpicks: fix them when cheap and safe, otherwise decline politely.

## 3. Fix round

A fix round as in the coordinator's step 9 (its reuse rules and **Routing**), never by hand: the exact items (`path:line — comment — fix`) go to the worker of each affected repo. Then, with the `factory:ship` skill rules: commit only those files (`fix(<scope>): address review comments (<ticket>)`, without ` (<ticket>)` when the task has no ticket) and **push to the same branch**.

## 4. Reply and resolve

Reply in every pending thread (in English, short): what you changed and the commit (`Fixed in <sha>: …`), or why you declined. **End every reply with `<!-- factory -->`** (invisible on GitHub): it is how pr-watch and the next round tell your answers from the user's comments. Then resolve per `resolveThreads`: `bot-only` = resolve threads opened by a bot, leave people's open; `all`; `none`.
```sh
gh api graphql -f query='mutation($t:ID!,$b:String!){addPullRequestReviewThreadReply(input:{pullRequestReviewThreadId:$t,body:$b}){comment{id}}}' -F t=<thread id> -F b=<body>
gh api graphql -f query='mutation($t:ID!){resolveReviewThread(input:{threadId:$t}){thread{isResolved}}}' -F t=<thread id>
```
Nitpicks from a review body: answer them all in **one** PR comment (`gh pr comment <n> --repo <owner/repo> --body-file <file>`), one line each, ending with `<!-- factory -->`.

## 5. Report

Add to the task's `result.md` (change folder, or `briefs/<task>/` for a lite task) under "PR review": round n, what was fixed / declined / left for the user. Tell the user in a few lines. The PR is **ready to merge** when no thread is pending and the checks are green (`gh pr checks`); say so, and never merge it yourself.

After `rounds` fix rounds on the same PR, stop and hand the rest to the user.

## Never
Merge, approve, request changes, dismiss reviews, force-push, edit or delete other people's comments, resolve a person's thread under `bot-only`, or touch a PR that is not this task's.
