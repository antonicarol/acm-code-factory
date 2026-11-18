# GitHub Issues tracker

Example adapter for `tracker.type: "github-issues"`: tickets are issues of `tracker.repo`, the status is a label from `tracker.status`. Uses only the `gh` CLI (already a factory requirement). A ticket `<ticket>` is `PAGE-<n>`, where `<n>` is the issue number.

Settings in `workspace.json` → `tracker`: `repo` (`owner/name`), `status` (maps `started`, `pr`, `merged` to labels) and `order` (the labels from first to last).

- **Read a ticket:** `gh issue view <n> --repo <repo> --json number,title,state,labels,assignees,body`. Save it to `.board/tickets/<ticket>.md` (title, labels, assignees, then the body) and print a card: title, status label, assignee, and the body's headings. Route from the card; the specker reads the file.
- **Read a status:** `gh issue view <n> --repo <repo> --json labels --jq '[.labels[].name | select(startswith("status:"))][0]'`.
- **Pending work:** `gh issue list --repo <repo> --assignee @me --state open --json number,title,labels`.
- **Move a status:** remove the current `status:` label and add the target one in one call: `gh issue edit <n> --repo <repo> --remove-label "<current>" --add-label "<target>"`. Compare positions in `tracker.order` first and skip if the issue is already at or past the target. When the status becomes `status:merged`, also close the issue: `gh issue close <n> --repo <repo>`.

Task creation is not covered by this adapter: create issues by hand or with `gh issue create`.
