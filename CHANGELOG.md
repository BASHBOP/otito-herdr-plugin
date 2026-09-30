# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Changed

- **Otito is now Solumbe.** The locked dependency is `@bashbop/solumbe@4.0.0` (was `@bashbop/otito@1.8.0`), the plugin id is `bashbop.solumbe` (actions are `bashbop.solumbe.review`, `bashbop.solumbe.gate-staged`, and so on; rebind any keybindings), the display name is "Solumbe Trust", the environment overrides are `SOLUMBE_BIN`, `SOLUMBE_REPO` and `SOLUMBE_REQUEST`, and the gate policy file is `solumbe.gate.json`. The review JSON the trust pane reads is unchanged between 1.8.0 and 4.0.0. The repository and package names (`BASHBOP/otito-herdr-plugin`, `@bashbop/otito-herdr-plugin`) are unchanged for now.

## [0.1.0] - 2026-08-21

### Added

- Herdr actions for Otito doctor, context, impact, review, and exact staged-tree validation.
- Interactive trust-status popup with an explicit hosted-CI and human-review boundary.
- Active workspace, worktree, pane, and selected-text context resolution.
- Locked `@bashbop/otito@1.8.0` dependency installed without lifecycle scripts.
- CI, tests, CODEOWNERS, contributor guidance, and security policy.
