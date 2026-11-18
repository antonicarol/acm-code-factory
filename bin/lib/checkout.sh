# Shared by task-start and task-move (source it): one lock for whoever switches a main checkout's branch,
# and the one rule for "the main checkout is busy".

# hub_lock <who>: waits for the hub lock (up to 30 s) and frees it on exit. Two scripts at once must not both
# see a main checkout as free and switch its branch.
hub_lock(){
  local lock="$HUB/.board/task-start.lock" got=""; mkdir -p "$HUB/.board"
  for _ in $(seq 100); do
    mkdir "$lock" 2>/dev/null && { echo $$ > "$lock/pid"; got=1; break; }
    kill -0 "$(cat "$lock/pid" 2>/dev/null)" 2>/dev/null || rm -rf "$lock"   # its owner died: stale
    sleep 0.3
  done
  [ -n "$got" ] || { echo "another $1 is still switching checkouts: try again in a minute" >&2; exit 1; }
  HUB_LOCK=$lock; trap 'rm -rf "$HUB_LOCK"' EXIT
}
hub_unlock(){ rm -rf "$HUB_LOCK"; trap - EXIT; }

# main_busy <src> <name> <task> <mode> [branches the checkout may be on...]: prints why the main checkout of repo
# <name> is busy, or nothing. Busy = another task links it, it has uncommitted changes, or (mode on-demand) it is on
# a branch that is none of the given ones (the user's own work in progress, even if committed).
main_busy(){
  local src=$1 name=$2 task=$3 mode=$4 other cur b; shift 4
  for other in "$HUB"/.tasks/*/"$name"; do
    [ -L "$other" ] && [ "$(basename "$(dirname "$other")")" != "$task" ] && { echo "in use by task $(basename "$(dirname "$other")")"; return; }
  done
  [ -n "$(git -C "$src" status --porcelain --untracked-files=no)" ] && { echo "has uncommitted changes"; return; }
  if [ "$mode" = on-demand ]; then
    cur=$(git -C "$src" branch --show-current)
    for b; do [ "$cur" = "$b" ] && return; done
    echo "is on your branch ${cur:-(detached HEAD)}"
  fi
}

# task_label <task>: its Herdr workspace label, the ticket at its start (PROJ-123-short-name → PROJ-123), else the task.
task_label(){ grep -oE '^[A-Za-z]+-[0-9]+' <<<"$1" || echo "$1"; }

# task_ws <task>: the Herdr workspace id task-start saved for <task>, only if it still exists with the task's label
# (after a Herdr restart an id can belong to another workspace). Prints nothing otherwise.
task_ws(){
  local ws label
  ws=$(jq -r '.workspace // empty' "$HUB/.board/tasks/$1.json" 2>/dev/null) || return 0
  [ -n "$ws" ] || return 0
  label=$(task_label "$1")
  herdr workspace list 2>/dev/null | jq -r --arg w "$ws" --arg l "$label" \
    '.result.workspaces[] | select(.workspace_id == $w and ((.label | ascii_downcase) == ($l | ascii_downcase))) | .workspace_id'
}

# task_repos <proposal.md|brief.md>: its "## Repos" table as repo|branch|base lines ("my-backend (`apps/x`)" → my-backend).
task_repos(){ awk -F'|' '/^## Repos/ {t=1; next} /^## / {t=0} t && /^\|/ && !/---/ && !/Branch/ {
                for (i=2;i<=4;i++) { gsub(/[` ]/, "", $i) }; sub(/\(.*/, "", $2); print $2 "|" $3 "|" $4 }' "$1"; }
# repo_slug <repo>: owner/name of the hub repo's GitHub origin, or nothing.
repo_slug(){ git -C "$HUB/$1" remote get-url origin 2>/dev/null | sed -E 's#^.*github\.com[:/]##; s#\.git$##'; }
