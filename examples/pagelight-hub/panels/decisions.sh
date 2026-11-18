# The hub's decisions (decisions/NNNN-*.md): number and title; enter opens one. A hub panel in a few lines.
TITLE="DECISIONS"
HELP="enter: open · ctrl-r: refresh"
REFRESH=0
rows(){ for f in "$HUB"/decisions/[0-9]*.md; do [ -f "$f" ] && printf '%s\t%s\n' "$f" "$(head -1 "$f" | sed 's/^# //')"; done; }
on_enter(){ open "$1"; }
