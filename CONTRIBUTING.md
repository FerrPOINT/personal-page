# Contributing — Personal Page

## Local setup

Use Node.js 24 and npm. The contact-delivery secrets belong in a local `.env`; never commit that file.

```bash
git clone git@github.com:FerrPOINT/personal-page.git
cd personal-page
make install
make check
```

The frontend development server is `http://127.0.0.1:8888`. The backend development server is `http://127.0.0.1:9000` and the Vite proxy forwards `/api` to it.

## Before a pull request

```bash
python3 -m unittest scripts.tests.test_verify_readme
python3 scripts/verify_readme.py
make check
npm test -- --list
make compose-config
```

For a user-facing portfolio change, build the frontend, start it locally, and exercise the changed flow in Chromium. Do not commit Playwright reports, dependency directories, `.env`, production databases, logs, contact submissions, tokens, or unreviewed screenshots.

## Content and evidence

- Portfolio definitions are typed source in `frontend/src/content`; article bodies are locale-specific Markdown under `frontend/src/content/articles`.
- Project-media variants are generated only with `frontend/scripts/optimize-project-images.mjs`; see `frontend/src/content/README.md`.
- `docs/screenshots/main-page.png` is the one reviewed README evidence. It must remain an actual `1920x1080` desktop capture of the locally built main page and must not include credentials, private messages, contact submissions, login UI, or mobile framing.

## Security

Report vulnerabilities privately to the repository owner. Do not publish exploit details, tokens, personal data, private keys, or database contents in issues, pull requests, screenshots, logs, or commits. See [SECURITY.md](SECURITY.md).