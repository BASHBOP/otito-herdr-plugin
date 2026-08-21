# Otito Trust for Herdr

[![CI](https://github.com/BASHBOP/otito-herdr-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/BASHBOP/otito-herdr-plugin/actions/workflows/ci.yml)
[![Herdr](https://img.shields.io/badge/Herdr-%E2%89%A50.8.2-111827)](https://herdr.dev/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Models generate the change. Otito proves whether it is safe to merge.**

Run [Otito](https://github.com/BASHBOP/otito) context, impact, review, and
exact staged-tree validation inside the
[Herdr](https://github.com/herdrdev/herdr) workspace that already hosts your
coding agents.

Herdr owns persistent terminals, panes, worktrees, and agent lifecycle. Otito
remains the independent local-first trust authority. This plugin passes the
active repository and selected task text from Herdr to a locked Otito
dependency; it does not fork Otito's engines or let Herdr award merge approval.

## Install

Requirements:

- Herdr 0.8.2 or newer
- Node.js 18.18 or newer
- Git

```bash
herdr plugin install BASHBOP/otito-herdr-plugin
```

Herdr shows the manifest and build command before installation. The build runs
`npm ci --ignore-scripts` to install the locked Otito dependency without
executing package lifecycle scripts.

## Use

```bash
herdr plugin action invoke bashbop.otito.doctor
herdr plugin action invoke bashbop.otito.review
herdr plugin action invoke bashbop.otito.gate-staged
herdr plugin pane open \
  --plugin bashbop.otito \
  --entrypoint trust-status
```

The context and impact actions use selected terminal text as the task request
when Herdr supplies a selection. The trust-status popup also lets you type a
request interactively.

The staged gate runs Otito's protected validation plan against the exact staged
Git tree. It does not commit, push, merge, or approve anything. Local evidence
also does not prove hosted CI, GitHub approvals, CODEOWNERS decisions, or the
absence of unresolved review conversations.

## Actions

| Action        | Purpose                                                        |
| ------------- | -------------------------------------------------------------- |
| `doctor`      | Check the bundled Otito runtime and optional tools             |
| `context`     | Build a task-aware repository context packet                   |
| `impact`      | Rank likely owner files, related tests, and risks              |
| `review`      | Combine impact, diff context, and the local gate verdict       |
| `gate-staged` | Validate the exact staged tree using the base-pinned gate plan |

## Optional keybindings

Add plugin actions to `~/.config/herdr/config.toml`:

```toml
[[keys.command]]
key = "prefix+o"
type = "plugin_action"
command = "bashbop.otito.review"
description = "review current change with Otito"

[[keys.command]]
key = "prefix+g"
type = "plugin_action"
command = "bashbop.otito.gate-staged"
description = "validate staged change with Otito"
```

## Local development

```bash
git clone https://github.com/BASHBOP/otito-herdr-plugin.git
cd otito-herdr-plugin
npm ci --ignore-scripts
npm run ci
herdr plugin link "$PWD"
herdr plugin action list --plugin bashbop.otito
```

Set `OTITO_BIN` to an explicit executable path to test another Otito build. Set
`OTITO_REPO` only when you deliberately want to override the repository
resolved from Herdr's active pane or worktree.

## Trust boundary

Plugin code runs as your user and is not sandboxed by Herdr. Review
`herdr-plugin.toml` and the scripts before installation, just as you would any
editor or coding-agent extension.

The plugin never sends repository content to a Bashbop service. Otito remains
local-first and deterministic. GitHub and hosted CI are queried only when you
explicitly use Otito's PR-aware commands outside this plugin's local actions.
