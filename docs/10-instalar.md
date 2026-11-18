# Install

By the end of this page you will have the `factory` command in your terminal and Herdr with the factory shortcuts. You do this once per machine; hubs come afterwards.

## Before you start

You need macOS (the scripts use BSD `sed` and `open`) and a Claude account with Claude Code.

| Tool | What for | Install |
|---|---|---|
| [Claude Code](https://claude.com/claude-code) | Every agent is a `claude` session | `curl -fsSL https://claude.ai/install.sh \| bash` |
| Herdr | Terminal multiplexer where the orchestrator, the coordinators and the panels live | The `herdr` binary on your `PATH` (tested with 0.9.5) |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | The spec for each task | `npm i -g @fission-ai/openspec` |
| `git`, `jq`, `python3`, `node` | The engine scripts and the `local-db` MCP | `brew install jq node python` |
| `gh` | PRs, checks and review comments | `brew install gh` and `gh auth login` |
| `fzf`, `git-delta`, `lazygit`, `neovim` | Panels, diff and editor for tasks | `brew install fzf git-delta lazygit neovim` |

Optional: [Ghostty](https://ghostty.org) for `factory open` (one window per hub), Docker if the hub uses a local DB (`localDb`), and `cursor-agent` to switch the kit to Cursor when your Claude usage runs out.

## 1. The engine

Put the `code-factory` repo wherever you like and link its command:

```sh
git clone <engine-url> ~/code-factory
mkdir -p ~/.local/bin
ln -s ~/code-factory/bin/factory ~/.local/bin/factory
```

`~/.local/bin` must be on your `PATH`. There is no build: a change in the engine reaches every hub immediately.

## 2. The Herdr shortcuts

Copy the contents of the engine's `templates/herdr/config.toml` into your `~/.config/herdr/config.toml` (if you already have one, add its blocks). It brings the sidebar subagent row and the keys `alt+0`…`alt+5`, `alt+e`, `alt+h`, `alt+m` and `ctrl+b` + `a d i r t`. All of them call `~/.local/bin/factory`.

## 3. Check

```sh
factory
```

With no hub yet, it answers that it can't find one; that already proves it is installed:

```text
factory: no hub (no workspace.json above /Users/you; set FACTORY_HUB or ~/.config/factory/hub)
```

If you see `command not found`, check the link and your `PATH`. With a hub, `factory` lists the engine commands, the hub's commands and the agents.

Next: create your project's hub.
