# Task-tracker adapters

The factory does not depend on a task manager. Without one, a request is a sentence typed to the orchestrator or dropped with `factory task "<what and why>"`. A tracker adds tickets: the orchestrator reads them, moves their status as PRs open and merge, and lists your pending work.

A tracker is an **adapter**: a folder with a `TRACKER.md`. The orchestrator loads `<hub>/trackers/<type>/TRACKER.md` if the hub has it, else `trackers/<type>/TRACKER.md` from the engine, where `<type>` is `workspace.json` → `tracker.type` (default `notion` when the hub has a `notion` key). Because the agents are LLMs, the adapter is mostly instructions plus whatever tools you have (an MCP server, `gh`, a CLI, `curl`). The engine ships one adapter: [`notion/`](notion/TRACKER.md).

## What an adapter has to say

Four operations, each in a few lines, with the exact tool calls:

| Operation | Contract |
|---|---|
| **Read a ticket** | Given a ticket id or URL, save the ticket to a file under `.board/` and print a short card (title, status, priority, short description, section names). The specker reads the file, so the orchestrator's context stays small. |
| **Read a status** | The current status of one ticket, cheaply (never the whole page). |
| **List pending work** | The tickets assigned to the user that are not done. |
| **Move a status** | Set the ticket to one of the tracker's own statuses. The factory asks for three moves: `started` (after `task-start`), `pr` (every repo has an open PR) and `merged` (every PR merged). Map them to your tracker's names. |

The engine's rules (move only the task's own status, never backwards, act on `[pr-watch]` messages) live in the orchestrator's **Task tracker** section and hold for every adapter.

## Config

`tracker` in `workspace.json` is free-form: `type` picks the adapter and the rest is for it to read (`status` map, `order`, project keys…). The Notion adapter keeps its own `notion` key.

## Not covered yet

- **Panel.** The `notion` panel (`factory inbox`) is Notion's. For another tracker, add a hub panel: [`panels/README.md`](../panels/README.md).
- **Creating tasks.** Jared and `task-creator` are written for Notion. Another tracker can add its own creator agent through the hub (`agents.<agent>` in `workspace.json`) or just skip creation.

## Writing one

1. Copy `trackers/notion/TRACKER.md` to `<hub>/trackers/<type>/TRACKER.md` and replace the four operations with your tracker's calls.
2. Set `"tracker": { "type": "<type>" }` in `workspace.json`, plus any settings the file reads.
3. Give the orchestrator the tools it needs: `agents.orchestrator.tools` (for example `mcp__<server>`).
4. Try it in a throwaway hub (`factory hub-init`) with one ticket before using it for real.
