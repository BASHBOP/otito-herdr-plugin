# Security Policy

## Reporting a vulnerability

Please report vulnerabilities privately through
[GitHub Security Advisories](https://github.com/BASHBOP/otito-herdr-plugin/security/advisories/new).
Do not open a public issue for a suspected vulnerability.

## Plugin boundary

Herdr plugins execute as the current user and are not sandboxed. This plugin
runs the bundled Otito CLI and Git commands against the repository selected by
the active Herdr context. Review the manifest and source before installation.

The plugin does not upload repository content or credentials. It does not
commit, push, merge, approve pull requests, or bypass validation.
