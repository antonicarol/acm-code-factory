# The hub's task inbox (factory task): what is waiting for the orchestrator, wherever it comes from.
TITLE="TASKS"
HELP="enter: to the orchestrator · ctrl-x: drop · ?: view"
REFRESH=10
rows(){ "$ENGINE/bin/task" --list; }
on_enter(){ "$ENGINE/bin/task" --send "$1"; }
on_ctrl-x(){ "$ENGINE/bin/task" --drop "$1"; }
preview(){ "$ENGINE/bin/task" --show "$1"; }
