# Dev servers (workspace.json "servers"): up/down, start and stop (factory servers).
TITLE="SERVERS"
HELP="enter: start or go · ctrl-x: stop"
REFRESH=5
INTERACTIVE="enter"   # docker asks for confirmation
rows(){ "$ENGINE/bin/servers" --list; }
on_enter(){ "$ENGINE/bin/servers" start "$1"; "$ENGINE/bin/servers" --focus "$1"; "$ENGINE/bin/servers" --browse "$1"; }
on_ctrl-x(){ "$ENGINE/bin/servers" stop "$1" 2>&1; }
