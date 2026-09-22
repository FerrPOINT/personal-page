# Security Policy

## Reporting a vulnerability

Do not report vulnerabilities through public issues, pull requests, changelogs, or discussions. Contact the repository owner through an agreed private channel and include a minimal safe reproduction, affected revision, impact, and mitigation idea.

Do not include working tokens, Telegram configuration, private keys, contact submissions, personal data, production SQLite databases, or full logs in the report.

## Security boundaries

- Runtime configuration is loaded from `.env`, which is intentionally excluded from Git. `.env.example` contains names only.
- The public edge serves the portfolio and only forwards `POST /api/contact`; other API paths and internal health endpoints are not published by the frontend Nginx configuration.
- The backend validates contact input, limits request bodies, uses rate limiting, and writes accepted messages to the local durable queue before delivery attempts.
- Production containers use loopback port bindings, read-only filesystems, dropped Linux capabilities, and `no-new-privileges`.

## Scope

The security policy covers this repository's frontend, backend, deployment configuration, documentation, tests, and tracked screenshot evidence. Third-party dependencies remain subject to their own security processes and licenses.