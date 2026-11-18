---
name: retro
description: Retrospective at the end of a task or session — collects what was learned (traps, facts the docs did not say or said wrong, data recipes, how we work), gets the user's approval per item and appends the approved ones to the hub's `learnings/` (or the testing guides). Coordinators run it after the ship; anyone in the kit can run it with `/factory:retro`.
---

# Retro

The point: the next agent working on the same area should not have to rediscover it. Only what cost effort to find out, or what the docs say wrong. Not a summary of the task, not what is already in the repo's `AGENTS.md`, `TESTING.md`, `context/` or the code itself.

Every line is read again by every later task in that area, so each one costs context. The bar is "without this, the next task here would lose a round", not "it is true and new". Few, short lines beat a complete record.

The hub is the root (the folder with `workspace.json`; from a task's `.tasks/<task>/` it is two levels up). You write only there.

## 1. Collect candidates

From this session: what you or your subagents had to discover, a wrong guess that cost a round (reviewer findings, failing tests, a tester `BLOCKED`), a doc line that turned out wrong, what the user corrected or explained. Include every `guideNotes` the testers returned. In a task, also read its `result.md` ("Ajustes", "Pendiente") and its `rounds/*/` (each `review.md` and `critique.md`: the blocking findings are the rounds that were lost).

Drop: behaviour readable in the code or the spec (status codes, validation rules, limits), details that only mattered to this task, anything a scout finds with one grep. Merge candidates about the same thing into one line. When a guide line is wrong, fix that line instead of adding a note.

Each candidate is ONE line, at most 200 chars, with:
- **type**: `pitfall` (looks like X, is Y) · `fact` (a fact about the code or a service) · `recipe` (test data, a command that works) · `how we work` (a team convention or a user preference);
- **scope**: repo and service/app (`api` · `billing-service`), or `workflow` when it is not about one repo.

Never secrets, tokens, real personal data or machine-specific absolute paths.

## 2. Ask the user

Read the files the candidates would go to (step 3) first and drop what is already there. Then show at most 5, ranked by the round each would save, numbered, in the user's language, each with its type, scope and destination, and ask in one message: which to keep, edit or drop, and "Did you learn or notice anything else worth writing down?". Nothing is written without their yes; no candidates and nothing from the user → say so and stop.

## 3. Write the approved ones

Destination by type and scope:
- `recipe`, or anything about running tests, users or test data → the testing guide, as the tester's `guideNotes` say (`testing/<repo>/…/TESTING.md`, under its section).
- everything else about one repo → `learnings/<repo>.md` (repo = its basename, e.g. `learnings/api.md`), under a `## <service or app>` heading (`## general` for the whole repo). Create the file or heading if missing.
- `workflow` → `learnings/workflow.md` (create it if missing).

Line format:
```
- 2026-10-26 · pitfall · `answer` returns 200, not 204 · PROJ-123 · ana
```
date · type · text · source (ticket or task name; `session` if none) · who (the user's git `user.name` or first name).

Before appending, look for an entry on the same thing: if it says the same, skip it; if it is outdated or wrong, replace that line (new date) instead of adding a contradicting one.

## 4. Promote (only when the user asks, or a heading passes ~20 lines)

An entry confirmed twice, or one every task in that area needs, belongs in the repo's own docs: propose the line for the repo's `AGENTS.md` (the user or a coordinator ships it with a PR) or for the hub's `context/`, and remove it from `learnings/` once it is there. Say which ones in one message; never edit a repo from here.

## Answer

One short line per written entry: file and text, in the user's language.
