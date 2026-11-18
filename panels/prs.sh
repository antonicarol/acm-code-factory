# My open PRs: review, checks and pending threads (factory prs).
TITLE="MY PRS"
HELP="enter: open · ?: checks · ctrl-r: refresh"
REFRESH=120
rows(){ "$ENGINE/bin/prs" --list; }
fetch(){ "$ENGINE/bin/prs" --fetch; }
on_enter(){ open "$1"; }
on_double-click(){ open "$1"; }
preview(){ "$ENGINE/bin/prs" --show "$1"; }
