# The task's screenshots (ui-tester and what the ui-designer judges): .board/shots/<task>/, newest on top.
# Args: [task] (default: the current folder: the panel runs in .tasks/<task>).
TITLE="RESOURCES"
HELP="enter: open · ctrl-o: all in Preview"
REFRESH=5
SHOTS="$HUB/.board/shots/${1:-$(basename "$PWD")}"   # sourced: $1 = the panel argument
rows(){
  local d=$SHOTS
  # ponytail: only images and videos; evidence.json and logs are not eyeballed
  ls -t "$d"/*.png "$d"/*.jpg "$d"/*.webp "$d"/*.mp4 2>/dev/null | while read -r f; do
    n=$(basename "$f"); c=2
    case $n in *-after*) c=32 ;; *-fail*) c=31 ;; esac
    printf '%s\t%s  \033[%sm%s\033[0m\n' "$f" "$(stat -f '%Sm' -t '%H:%M' "$f")" "$c" "$n"
  done
  [ -n "$(ls -A "$d" 2>/dev/null)" ] || printf '\t\033[2mno screenshots yet (%s)\033[0m\n' "${d#"$HUB"/}"
}
on_enter(){ [ -n "$1" ] && open "$1"; }
on_double-click(){ on_enter "$1"; }
on_ctrl-o(){ ls "$SHOTS"/*.png >/dev/null 2>&1 && open -a Preview "$SHOTS"/*.png; }
