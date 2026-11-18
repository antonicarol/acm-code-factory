# Pagelight hub (example)

An example of a hub created with `factory hub-init`, filled in for a **fictional** product: Pagelight, an online bookshop with a web app, an API and its infrastructure. Everything here (people, tickets, PRs, numbers) is invented. It shows what a hub looks like after a few weeks of use.

The repos (`web/`, `api/`, `infra/`) are not included: in a real hub they are links to your checkouts (`ln -s ../web web`).

## Read it in this order

| What | Where | What it shows |
|---|---|---|
| The map | [`AGENTS.md`](AGENTS.md) | Which repo a task goes to, where things are kept, what is never done |
| The config | [`workspace.json`](workspace.json) | Repos and roles, gate checks, servers, panels, routing, a tracker, an agent note |
| The knowledge | [`context/`](context/), [`decisions/`](decisions/), [`learnings/`](learnings/), [`testing/`](testing/) | What agents read before planning |
| A finished task | [`openspec/changes/PAGE-42-wishlist/`](openspec/changes/PAGE-42-wishlist/) | Proposal, specs, tasks, `result.md` and two review rounds |
| A light task | [`briefs/fix-footer-link/`](briefs/fix-footer-link/) | A brief and its result, no full OpenSpec change |
| Current requirements | [`openspec/specs/`](openspec/specs/) | What the system does today; it grows when a change is archived |
| A custom panel | [`panels/decisions.sh`](panels/decisions.sh) | A hub panel in 10 lines |
| A custom tracker | [`trackers/github-issues/TRACKER.md`](trackers/github-issues/TRACKER.md) | A task tracker adapter built on `gh` |

## Using it

Read it as a reference, and start your own with `factory hub-init ~/projects/my-hub my-store`: that gives you the same skeleton, empty. Then copy over what helps (the `AGENTS.md` shape, a `TESTING.md`, the tracker adapter, the panel).

The generated runtime folders (`.board/`, `.tasks/`, `audits/`, `personal/`) are not here: they appear when you work and are ignored by git.
