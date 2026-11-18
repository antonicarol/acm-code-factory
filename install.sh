#!/usr/bin/env bash
# Installs the `factory` command: checks the tools the engine needs and links bin/factory into ~/.local/bin.
# Safe to run again. It never overwrites your Herdr config: it only tells you what to merge.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)

[ "$(uname)" = Darwin ] || { echo "code-factory needs macOS (BSD sed, open); Linux is not supported yet." >&2; exit 1; }

missing=()
for t in claude herdr openspec git jq python3 node gh; do command -v "$t" >/dev/null 2>&1 || missing+=("$t"); done
for t in fzf delta lazygit nvim; do command -v "$t" >/dev/null 2>&1 || echo "optional, not found: $t (panels and diff views use it: brew install fzf git-delta lazygit neovim)"; done
if [ ${#missing[@]} -gt 0 ]; then
  echo "Missing required tools: ${missing[*]}" >&2
  echo "  claude   curl -fsSL https://claude.ai/install.sh | bash" >&2
  echo "  openspec npm i -g @fission-ai/openspec" >&2
  echo "  others   brew install jq node python gh git   (herdr: put the binary on your PATH)" >&2
  exit 1
fi

mkdir -p "$HOME/.local/bin"
ln -sf "$here/bin/factory" "$HOME/.local/bin/factory"
case ":$PATH:" in *":$HOME/.local/bin:"*) ;; *) echo "Add ~/.local/bin to your PATH (e.g. in ~/.zshrc): export PATH=\"\$HOME/.local/bin:\$PATH\"" ;; esac

echo "Installed: ~/.local/bin/factory -> $here/bin/factory"
echo "Next:"
echo "  1. Merge $here/templates/herdr/config.toml into ~/.config/herdr/config.toml (shortcuts and the subagents row)."
echo "  2. Create a hub:  factory hub-init ~/projects/my-hub my-store"
echo "  3. Start it:      cd ~/projects/my-hub && factory orchestrator -n orchestrator"
echo "Guide: docs/README.md (or run: factory docs)"
