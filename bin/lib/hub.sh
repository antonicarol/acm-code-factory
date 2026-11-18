# Sourced by every engine script. ENGINE = this engine (code-factory); HUB = the hub it works on:
# $FACTORY_HUB, else the nearest folder with a workspace.json above the current directory, else the
# default hub in ~/.config/factory/hub (for Herdr keys run outside any hub).
ENGINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
if [ -z "${FACTORY_HUB:-}" ]; then
  # Stop where dirname stops changing too: with a deleted cwd $PWD can be "." or empty, and dirname "." is "." forever.
  _d=${PWD:-/}; while [ "$_d" != / ] && [ "$_d" != . ] && [ ! -f "$_d/workspace.json" ]; do _d=$(dirname "$_d"); done
  if [ -f "$_d/workspace.json" ]; then FACTORY_HUB=$_d; else FACTORY_HUB=$(cat ~/.config/factory/hub 2>/dev/null || true); fi
fi
[ -f "${FACTORY_HUB:-}/workspace.json" ] || { echo "factory: no hub (no workspace.json above $PWD; set FACTORY_HUB or ~/.config/factory/hub)" >&2; exit 1; }
HUB=$FACTORY_HUB; FACTORY_HOME=$ENGINE
# Its own Herdr session (workspace.json herdr.session): outside Herdr, every herdr call (and the scripts that talk to
# the socket) goes to it. Inside a Herdr pane nothing changes: the pane already carries its session's socket.
HUB_SESSION=$(jq -r '.herdr.session // empty' "$HUB/workspace.json" 2>/dev/null || true)
if [ -n "$HUB_SESSION" ] && [ "${HERDR_ENV:-}" != 1 ]; then
  export HERDR_SESSION=$HUB_SESSION HERDR_SOCKET_PATH="$HOME/.config/herdr/sessions/$HUB_SESSION/herdr.sock"
fi
# Its Herdr workspace label: "hub" when it has its own session or is the default hub; "hub · <name>" for a hub that
# shares the session with others (two hubs open at once).
if [ -n "$HUB_SESSION" ] || [ "$HUB" = "$(cat ~/.config/factory/hub 2>/dev/null || true)" ]; then HUB_LABEL=hub
else HUB_LABEL="hub · $(basename "$HUB")"; fi
export FACTORY_HUB FACTORY_HOME HUB_LABEL HUB_SESSION

# orch_pane: "<pane_id> <agent_status>" of this hub's orchestrator (title "orchestrator" and cwd = the hub: `herdr
# agent list` returns the agents of every hub; or the pane claude-kit saved, for providers that set no title), or nothing.
orch_pane(){
  herdr agent list 2>/dev/null | jq -r --arg h "$HUB" --arg p "$(cat "$HUB/.board/orchestrator.pane" 2>/dev/null)" \
    '.result.agents[] | select(.cwd == $h and (.terminal_title_stripped == "orchestrator" or .pane_id == $p))
    | "\(.pane_id) \(.agent_status)"' | head -1
}
