# My Notion tasks in tabs: current sprint, next, backlog and dates (the sprints of a range you pick); in progress and review on top, then by priority; enter sends them to the orchestrator (factory inbox).
TITLE="MY TASKS"
HELP="1-4 or tab: tab · ctrl-f: dates · enter: to the orchestrator · ctrl-o: open in Notion · ctrl-r: refresh · ◐ = running"
REFRESH=600
INTERACTIVE="ctrl-f"
rows(){ "$ENGINE/bin/inbox" --list; }
fetch(){ "$ENGINE/bin/inbox" --fetch; }
on_enter(){ "$ENGINE/bin/inbox" --send "$1"; }
on_double-click(){ on_enter "$1"; }
on_tab(){ "$ENGINE/bin/inbox" --tab next; }
on_btab(){ "$ENGINE/bin/inbox" --tab prev; }
on_1(){ "$ENGINE/bin/inbox" --tab 1; }
on_2(){ "$ENGINE/bin/inbox" --tab 2; }
on_3(){ "$ENGINE/bin/inbox" --tab 3; }
on_4(){ "$ENGINE/bin/inbox" --tab 4; }
on_ctrl-f(){ "$ENGINE/bin/inbox" --dates; }
on_ctrl-o(){ [ "$1" -gt 0 ] 2>/dev/null && open "$(jq -r --argjson i "$1" '.[] | select(.id == $i) | .url' "$HUB/.board/notion-tasks.json")"; }
