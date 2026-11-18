# Decisions (ADR)

Decisions that affect more than one repo or how we work (single-repo ones go in that repo). The orchestrator reads them before planning. One per file: `NNNN-short-title.md`, sequential numbering. They are not edited once accepted: if they change, a new one is written that replaces it and the old one is marked `Superseded by NNNN`.

## Template

```md
# NNNN · Title

- Status: proposed | accepted | superseded by NNNN
- Date: YYYY-MM-DD
- Affected repos: …

## Context
What the problem was and what constraints there were.

## Decision
What was decided, in one or two sentences.

## Consequences
What changes, what is gained, what is lost.
```
