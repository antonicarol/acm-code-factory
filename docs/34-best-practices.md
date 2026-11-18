# Best practices

How to get reliable results from the factory, and how to keep it safe when you are not watching. Each point says what to do and where the factory already helps. The security points are rules the harness enforces; the rest are habits.

## Be in the loop less, but know what replaced you

When you stop approving every step, something else has to do it. In the factory that is:

| You used to… | Now… |
|---|---|
| steer the model mid-session | the spec and plan (`approvals` in `workspace.json`) say what "done" means before work starts |
| approve every command | the permission mode of the session plus `deny` rules |
| read every change | the gate (`factory gate`), the reviewer, the tester and CI |
| start every session | the orchestrator launches one coordinator per task |

Hand over one step at a time. Start with `approvals.spec: "ask"` and `ship: "ask"`; once a kind of task keeps coming out right, move it to `auto`.

## Safety: what is enforced and what is a request

A line in a prompt or `AGENTS.md` ("never read `.env`") is a request to the model. Only the harness can guarantee something.

- **`deny` rules come first.** `bin/lib/kit-settings.json` carries `deny` rules for `.env` and `.env.*`. Claude Code checks them before anything else, so no tool call that matches them runs. Add a rule for anything that is hard to take back: deleting uncommitted work, reading credentials, writing to production. If Claude gets it wrong once and you can revert it, a prompt is enough; if you cannot, make it a rule.
- **A rule limits the call, not what the call reaches.** `npm test` is allowed, but a compromised dependency it runs can still open files. A sandbox (the operating system enforcing which files, folders and hosts a command may touch) is what limits that. It covers shell commands only, not MCP servers or hooks.
- **Give an agent only the tools it needs.** `agents.<agent>.tools` adds tools to one agent, not to all. A database MCP pointed at production belongs on one agent, read-only, with a note saying so (`agents.<agent>.notes`).
- **Keep secrets out of the repos you link.** Scripts copy `.env*` files into worktrees without opening them. Never paste a secret into a task, a spec or a PR description.
- **The machine is disposable, what leaves it is not.** A pushed commit or a message sent through a connector cannot be pulled back. Keep `ship: "ask"` until you trust the gate.

## Verification: make "done" something that passes or fails

Without you reading every change, "done" has to be something a machine can check.

- **Write what done looks like in the task.** Ask for tests per sub-task and for the real output to be shown, since you were not there to see it.
- **Use the gate for checks that must always run.** `workspace.json` → `gate.repos.<repo>.checks` runs before any reviewer. Prompts can be skipped by a model; the gate cannot.
- **Protect the tests.** `gate.protected` flags edits to test and lint config, so a failing check is not "fixed" by weakening it.
- **A check that fails must exit with a non-zero code a hook or script acts on.** In Claude Code hooks, exit code `2` sends the model back to fix the problem; exit code `1` does not. If you add your own hooks, use `2`.
- **Review with a fresh context.** The reviewer is a separate agent that did not write the code. Keep it that way; do not ask the worker to review itself.
- **Let CI be the common net.** Every task ends in a PR, and CI runs the same checks however the session was set up. Turn on the review loop (`reviewLoop`) so a failing check goes back to the coordinator.
- **Scale review to risk.** Docs and copy changes can merge when checks are green; ordinary changes need one reviewer; migrations, auth and infra changes deserve two. The `gate.attention` patterns flag these for you.

## Keep instructions short

- **`AGENTS.md` holds what the model cannot see in the code**: where a task goes, rules that are not obvious, systems that are not referenced anywhere. Not the stack, not "where to look".
- **Avoid shouting.** Capitals, `IMPORTANT` and `NEVER` in prompts tend to send current models off course and add tool calls. State the rule and the reason once.
- **Put project facts in the hub, not in the engine.** A prompt in `kit/` says "the repo with role `ui`", never a repo name. This keeps one engine usable for many projects.
- **Write down what was costly to learn.** `factory retro` turns a finished task into dated lines in `learnings/`; the coordinator and specker read them before planning.

## Run it in a way you can recover from

- **Test engine changes in a throwaway hub.** A task dropped in a live hub's `.board/inbox/` is executed. Use `factory hub-init <scratch>/x probe-x`, then `openspec store unregister probe-x`.
- **Restart after changing the engine.** Open orchestrators and coordinators keep the kit they started with; open panels keep their command. See [Hubs, sessions and extensions](27-hubs-y-sesiones.md).
- **One task, one worktree.** Do not let two tasks share a working folder; `factory task-start` prepares each one. Use `factory task-move` when you want to try a task in your main checkout.
- **Watch cost and limits.** `factory usage` shows the account's usage window. With the Cursor provider configured, new coordinators can move there when a Claude window is nearly spent.

## Experimental: Code Mode

Code Mode (a Claude Code feature, off by default) lets a session write JavaScript that chains tool calls and returns only the result, instead of reading every intermediate output. It can lower tokens on repetitive search-and-edit work, and it is a poor fit for a single command.

- Turn it on per agent: `"agents": { "worker": { "codeMode": true } }` in `workspace.json` (see [Configuration](31-configuracion.md)).
- It needs an interactive `claude` session and a Claude account; it does not work through `claude -p`, other providers, or sessions that need Claude in Chrome or computer use.
- Try it in a throwaway hub first, compare `/cost` with and without it on the same task, and read the scripts with `Ctrl+O`.
- Treat it as unstable: the feature may change or disappear in any Claude Code release.

## A good first week

1. Install, create a hub, link one repo, and run one small task with `ship: "ask"`.
2. Read the spec, the plan and the review of that task end to end once, to learn what each agent produces.
3. Fill in `gate.repos.<repo>.checks` with your real lint, type and test commands.
4. Add `deny` rules for what you could not undo, and put your repo map and non-obvious rules in the hub's `AGENTS.md`.
5. Run a few tasks of the same kind; when they come out right, relax one `ask` to `auto`.
