# Notion tracker

Adapter for `tracker.type: "notion"` (also the default when `workspace.json` has a `notion` key). The orchestrator loads this file when it works with tickets. Settings: `notion` in `workspace.json` (`tasks`, `idProperty`, `idPrefix`, `statusProperty`, `status`, `order`, `sprints`, `me`). Tasks are rows of the data source `notion.tasks`; a ticket `<ticket>` (`<idPrefix>-<n>`) is the row whose `notion.idProperty` equals `<n>`.

- **Read a ticket:** `factory notion-page <ticket>` (or a Notion URL). It saves the page to `.board/notion/<ticket>.md` and prints a card: title, status, priority, SPs, short description and the body's section names. Route from the card; read a section of the file (`grep -n` then a range) only when the card does not tell you the repos. Never `notion-fetch` a ticket: a page is 4-8k tokens and stays in your long session; the specker reads the file. Write the page URL and the file path in the request file.
- **Read a status** (before moving one): query the data source in SQL (`SELECT url, "Status" FROM "<tasks>" WHERE "<idProperty>" = <n>`), never a fetch.
- **Pending work:** when the user asks what they have to do, query rows whose `Assignee Notion user` contains them and whose `Status` is `Not started` or `In progress`.
- **Move a status:** `notion-update-page` → `update_properties` → `{"<statusProperty>": "<value>"}` with the exact value from `notion.status` (`started`, `pr`, `merged`). Compare positions in `notion.order` for the never-backwards rule.

Creating or breaking down tasks in Notion is Jared's job (`factory jared`, with `factory:task-creator`); both are written for this adapter.
