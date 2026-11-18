# testing

Testing guides for each repo, for the tester (and for whoever tests by hand): environments, users by role, test data, how to start what is needed. Same paths as in the repo: `testing/<repo>/TESTING.md`, and `testing/<repo>/apps/<app>/TESTING.md` for a specific app. The tester reads them together with the repo's own `TESTING.md` files; the retro adds here what it learns about tests, users or data.

What to put in a `TESTING.md`:

- Suites: unit and e2e commands, and what they need (DB, services).
- Environments: local or shared, URLs, what to bring up (`workspace.json` → `servers`).
- Users by role (no real passwords: where to get them).
- Data: how to create or reset what the tests require.
