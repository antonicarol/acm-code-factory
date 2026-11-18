# Tree of what is running: orchestrator, coordinators and their subagents (factory board). Args: --pane <id> = only that session.
TITLE="AGENTS"
HELP="refreshes every 2 s"
REFRESH=2
INPUT=0
rows(){ [ $# -eq 0 ] && printf 'usage\t\033[2m%s\033[0m\n' "$("$ENGINE/bin/usage" 2>/dev/null)"   # hub only: the account's usage on top
        "$ENGINE/bin/board" "$@" --once 2>/dev/null | sed 1,2d | awk '{ printf "%d\t%s\n", NR, $0 }'; }
