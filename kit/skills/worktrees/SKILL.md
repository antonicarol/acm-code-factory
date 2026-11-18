---
name: worktrees
description: How parallel tasks share this machine in a factory hub — the user's main task in the main checkout, the other tasks in git worktrees, per-task dev servers through the hub's `task-servers` command, and the shared local backend and database. Use when a task's repo folder is a worktree, when starting, testing or stopping a task's servers, or when the user asks how parallel tasks work.
---

# Parallel tasks: main checkout and worktrees

## The model

- **Main task = main checkout.** The task the user is watching runs in the main checkouts (`.tasks/<task>/<repo>` is a link to them), on its branch. The user validates it by hand there, with the servers panel (`factory servers`). Agents never stop, restart or retarget those servers.
- **Every other task = worktree.** When the main checkout is busy (another task, the user's uncommitted changes, or with `worktrees: "on-demand"` the user's own branch even if committed), `factory task-start` puts the task in a git worktree at `.tasks/<task>/<repo>` and runs `repos.<repo>.setup` there (install, local env files; log in `.board/setup/`). `workspace.json` `worktrees` and `repos.<repo>.worktrees` decide it.
- **Promote** a worktree task when the user wants to look at it: `factory task-move <task>` (the main checkout must be free). **Close** with `factory task-end <task>`: it stops the task's servers and removes the worktree.

## Servers of a worktree task

A repo with `repos.<repo>.taskServers` runs its dev servers inside each worktree through the hub's own `task-servers` command (`<hub>/bin/task-servers`; how it avoids port clashes is the hub's business: its `task-servers` skill, when it has one). The contract the engine relies on:

```bash
factory task-servers <task> start <app> [app...]   # prints the URLs to use
factory task-servers <task> stop
factory task-servers <task> status                 # setup state and running apps
```

- Run them only while something needs them: a dev server can take 0.5–1.5 GB.
- At most `workspace.json` `taskServers` tasks run their servers at once. Exit 75 means setup still running or no free place: run it again (that wait is normal).
- Name every app in one `start`: asking for another set restarts them with it.
- Use the URLs `start` prints, never the ports in a plan or guide: those are the user's main checkout, on another branch.
- Who starts them stops them, before reporting (the `tester` and the `ui-tester` do). `factory task-end` and `factory task-move` stop them too.
- Before running anything that needs installed dependencies, check `status`: `setup running` → wait; `failed` or `never run` → report the log path it prints.

## Shared: backend and database

- **One local backend.** When it runs from the main checkout of the `api` repo (the hub's `docker` skill says so), only the task in that checkout can test backend changes on screen; a worktree task with backend changes can run its suites, but its UI flows need the user to promote it (`needsUser`: `factory task-move <task>`). Never start, restart or reset the backend stack.
- **One local database**, shared by every task and the user. Create the data your flows need (`local-db` MCP or the API) instead of reusing another task's, name it after your task (`<task> …`), and never delete or change data you did not create.

## Browsers

Cookies ignore ports: in the user's browser two tasks' fronts on different ports share one session. Playwright contexts are isolated, so test runs are not affected; a person checking a worktree task uses a separate browser profile.
