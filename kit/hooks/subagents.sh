#!/usr/bin/env bash
# Records this session's subagents for the board (factory board) and mirrors the running ones into its
# Herdr pane as the `$subagents` sidebar token. Hooked on PreToolUse/PostToolUse(Agent|Task), SubagentStart
# and SubagentStop (kit/hooks/hooks.json).
#   .board/<session_id>.meta  →  cwd, pane
#   .board/<session_id>       →  one line per subagent: id|type|description|start|end
in=$(cat)
[ -n "${FACTORY_HOOK_LOG:-}" ] && printf '%s\n' "$in" >> "$FACTORY_HOOK_LOG"
HUB=${FACTORY_HUB:-}; [ -n "$HUB" ] || exit 0   # set by bin/lib/kit-settings
board="${FACTORY_BOARD_DIR:-$HUB/.board}"; mkdir -p "$board"
# Every field in one jq (missing → ""): event, sid, cwd, desc, stype (tool_input), id, atype, rid (tool_response).
eval "$(jq -r '@sh "event=\(.hook_event_name // "") sid=\(.session_id // "") cwd=\(.cwd // "")
  desc=\(.tool_input.description? // "") stype=\(.tool_input.subagent_type? // "")
  id=\(.agent_id // "") atype=\(.agent_type // "") rid=\(.tool_response.agentId? // "")"' <<<"$in" 2>/dev/null)"
[ -n "${sid:-}" ] || exit 0
log="$board/$sid"; touch "$log"
[ -f "$log.meta" ] || printf 'cwd=%s\npane=%s\n' "$cwd" "${HERDR_PANE_ID:-}" > "$log.meta"
now=$(date +%s)
desc=${desc//|//}; desc=${desc//$'\n'/ }
# Parallel hooks rewrite these files: serialize them (flock via lockf; the kernel frees it if a hook dies).
# No lock after 5 s → skip this event rather than write unlocked (a lost line beats a torn file).
exec 9>>"$board/.subagents.lock" && /usr/bin/lockf -s -t 5 9 || exit 0
trap 'rm -f "$tmp"' EXIT
tmp=$(mktemp "$board/.tmp.XXXXXX")
case "$event" in
  PreToolUse)   # SubagentStart has no description: it comes right after this and takes the oldest line of its type
    type=${stype#*:}
    printf '%s|%s\n' "${type:-general}" "$desc" >> "$log.pending" ;;
  SubagentStart)  # the oldest call of its type (parallel launches start in order); PostToolUse corrects any mismatch
    type=${atype#*:}; desc=""
    if [ -f "$log.pending" ] && line=$(grep -n "^${type:-general}|" "$log.pending" | head -1) && [ -n "$line" ]; then
      n=${line%%:*}; line=${line#*:}; desc=${line#*|}; sed "${n}d" "$log.pending" > "$tmp"; mv "$tmp" "$log.pending"
    fi
    echo "$id|${type:-agent}|$desc|$now|" >> "$log" ;;
  PostToolUse)  # authoritative: the response names the agent this call started (at launch for background agents)
    [ -n "$rid" ] || exit 0
    awk -F'|' -v OFS='|' -v id="$rid" -v d="$desc" '$1==id {$3=d} 1' "$log" > "$tmp" && mv "$tmp" "$log" ;;
  SubagentStop)
    awk -F'|' -v OFS='|' -v id="$id" -v t="$now" '$1==id && $5=="" {$5=t} 1' "$log" > "$tmp" && mv "$tmp" "$log" ;;
esac
rm -f "$tmp"
summary=$(awk -F'|' '$5=="" {n[$2]++} END {for (t in n) printf "%s%s", (s++ ? " · " : ""), (n[t] > 1 ? n[t] "×" t : t)}' "$log")
exec 9>&-; trap - EXIT   # the files are written: release before the slow herdr call
[ "${HERDR_ENV:-}" = 1 ] && [ -n "${HERDR_PANE_ID:-}" ] || exit 0
if [ -n "$summary" ]; then
  herdr pane report-metadata "$HERDR_PANE_ID" --source factory-subagents --token "subagents=└ $summary" >/dev/null 2>&1
else
  herdr pane report-metadata "$HERDR_PANE_ID" --source factory-subagents --clear-token subagents >/dev/null 2>&1
fi
exit 0
