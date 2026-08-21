# Contributing

Thank you for improving the Otito Trust plugin for Herdr.

## Development

```bash
npm ci --ignore-scripts
npm run ci
```

Use a feature branch and keep changes focused. Prefer Conventional Commits,
for example `fix(runtime): resolve the active worktree first`.

When behavior changes, update the tests and README in the same pull request.
Do not weaken the trust boundary: a local Otito verdict must never be presented
as proof of hosted CI, CODEOWNERS approval, resolved review conversations, or a
human merge decision.

Before opening a pull request:

- run `npm run ci`
- run `otito gate . --staged --run-validation --base origin/main` when reviewing a staged follow-up
- validate the manifest with Herdr 0.8.2 or newer
- exercise the changed action against a disposable repository
- confirm no credentials, repository content, or generated `.otito` evidence is committed
