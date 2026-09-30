# Agent workflow

This repository contains the Herdr adapter for Solumbe. Keep Herdr orchestration
and Solumbe trust evidence separate.

- Run `solumbe context "<task>" --path .` before broad edits.
- Run both `solumbe impact . "<task>"` and `impact-map . "<task>"` when scope or risk is unclear.
- Run `npm run ci` before review.
- Validate `herdr-plugin.toml` with the oldest supported Herdr version.
- Keep local evidence, hosted checks, CODEOWNERS, and human approval as separate authorities.
- Never add automatic commit, push, merge, approval, or validation-bypass behavior.
