# Portfolio content

`definitions.ts` is the source of truth for projects, experience, skills, and article metadata. Stable technical values are stored once; user-facing copy lives under each item's `locales.ru` and `locales.en` fields. UI labels remain in `src/i18n/translations`.

Article bodies live in `articles/*.ru.md` and `articles/*.en.md` and are loaded only when an article is opened.

## Adding a project image

1. Place a 16:9 PNG, JPEG, or WebP source in `frontend/assets-source/projects/<slug>.<ext>`. Source images are intentionally ignored by Git.
2. Run `npm run images:optimize -- <slug>` from `frontend`.
3. Commit the generated 800×450 and 1600×900 AVIF/WebP variants from `src/assets/projects`.
4. Import the four generated files in `definitions.ts` and reference them from the project's `media` array.

Every media item needs Russian and English alternative text. Public project media must not use remote URLs, client branding, credentials, or personal data.
