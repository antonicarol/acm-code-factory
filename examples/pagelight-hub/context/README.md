# context

Stable project knowledge, the kind that does not change from one task to the next. It is read by the orchestrator (to decide repos), the specker (to write the spec) and the workers when the plan links it. If you learn something durable during a task, propose the change here; what belongs to a single repo goes in that repo.

Usual files (create them when you have something to put in them):

- `product.md`: what the product is, who it is for, surfaces (apps, screens) and what is out of scope.
- `architecture.md`: how the repos and services fit together, where a request goes through, where each piece of data lives.
- `glossary.md`: domain terms in a `Term | Meaning | Where it lives` table.
- `environments.md`: environments (local, staging, production), URLs, what to bring up for each thing and what never to touch.

If the product is defined elsewhere (Notion, Obsidian, Drive), note it in `product.md` with the path and how to read it.
