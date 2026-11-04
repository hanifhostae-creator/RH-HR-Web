# Admin panel & back end — separate session

This folder is reserved for the **admin panel and back end**, built in its own Claude Code
session. The public website (front end) lives in the repo root and is built in a different
session — read `../CLAUDE.md` first.

## Goal

Let the site owner manage everything on the public website without editing code.

## What is built (see `admin/README.md` for details and Hostinger deployment)

Stack: **PHP 8.1+ with JSON files** (no database, no Composer) so it runs on Hostinger shared
hosting. Local: `php -S localhost:8000 admin/router.php`.

- `admin/index.html`, `admin.css`, `admin.js` — the admin panel (vanilla JS, schema-driven editor
  for every `window.SITE` key; `SECTIONS` in `admin.js` mirrors the content contract).
- `admin/api.php` — the API (`/api/<route>`, rewritten by the root `.htaccess`). It reads
  `assets/js/content.js`, validates and rewrites it on save, keeps versions in `admin/data/history/`,
  creates/refreshes/removes `service-<id>.html` pages and their `sitemap.xml` entries.
- `admin/data/` — users, leads, meta, history (private, git-ignored, blocked by `.htaccess`).
- `assets/uploads/` — uploaded images.
- `admin/demo/` — shareable demo (real UI + in-browser mock API in `demo-api.js`).

Front-end touch points (kept minimal): `assets/js/app.js` forms POST to `api/leads` with a
`mailto:` fallback and a honeypot field; `window.RH_DEMO` lets the demo preview send forms to the mock API.

## Rules for the admin session

- Keep all admin and server code inside `admin/` (plus the root `.htaccess` and `assets/uploads/.htaccess`).
- Do not redesign the public pages; match their dark navy / blue / gold look in the admin UI.
- Keep the content keys stable; if a key must change, update `../assets/js/app.js`, the `SECTIONS`
  schema in `admin.js`, `validate_content()` in `api.php` and `admin/demo/demo-api.js` too.
- Optional `image` fields on `services[]` and `projects[]` are stored by the admin but not yet
  rendered by the front end (that is a front-end session task).
- After changing `admin.js`/`admin.css`, rebuild the demo with `python3 admin/demo/build-demo.py <dir>`.
