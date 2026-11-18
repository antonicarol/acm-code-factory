#!/usr/bin/env bash
# Kills test-runner workers left orphaned (parent PID 1) when a vitest/jest run is cut off (tool timeout,
# cancelled agent). Nobody can use them any more and each can hold GBs. Hooked on SubagentStop (kit/hooks/hooks.json)
# and run every minute by sys-watch; a live run's workers still have their runner as parent, so they are never touched.
cat >/dev/null
ps -axo pid=,ppid=,command= | awk '$2 == 1 && ($3 ~ /^node$/ && $4 ~ /^\(vitest/ || /jest-worker\/build\/workers\/processChild/) { print $1 }' |
  xargs kill 2>/dev/null
exit 0
