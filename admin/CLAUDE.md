# Admin panel & back end — separate session

This folder is reserved for the **admin panel and back end**, built in its own Claude Code
session. The public website (front end) lives in the repo root and is built in a different
session — read `../CLAUDE.md` first.

## Goal

Let the site owner manage everything on the public website without editing code.

## What is built (see `admin/README.md` for details and Hostinger deployment)

Stack: **PHP 8.1+ with MySQL/MariaDB via PDO** (SQLite also works for local tests), no Composer,
so it runs on Hostinger shared hosting. Local: `php -S localhost:8000 admin/router.php`.

- `admin/index.html`, `admin.css`, `admin.js` — the admin panel (vanilla JS, schema-driven editor
  for every `window.SITE` key; `SECTIONS` in `admin.js` mirrors the content contract).
- `admin/api.php` — the API router (`/api/<route>`, rewritten by the root `.htaccess`).
- `admin/lib/core.php` (HTTP helpers), `lib/content.php` (content.js read/write, validation,
  service pages, sitemap, `?v=` cache-busting), `lib/db.php` (PDO, schema, installer, throttle,
  activity log, TOTP two-step codes).
- The database (`rh_*` tables) is the source of truth for content, versions, leads, users,
  activity and settings. Every save publishes the public files from it; `ensure_published()`
  rewrites them if `content.js` no longer matches (e.g. after new site files were uploaded).
- `admin/data/config.php` — database login written by the first-run installer (private, git-ignored).
- `assets/uploads/` — uploaded images.
- `admin/demo/` — shareable demo (real UI + in-browser mock API in `demo-api.js`).

Front-end touch points (kept minimal): `assets/js/app.js` forms POST to `api/leads` with a
`mailto:` fallback and a honeypot field; `company.map` / `company.addressShort` feed the map and
top bar; `window.RH_DEMO` lets the demo preview send forms to the mock API.

## Rules for the admin session

- Keep all admin and server code inside `admin/` (plus the root `.htaccess` and `assets/uploads/.htaccess`).
- Do not redesign the public pages; match their dark navy / blue / gold look in the admin UI.
- Keep the content keys stable; if a key must change, update `../assets/js/app.js`, the `SECTIONS`
  schema in `admin.js`, `validate_content()` in `lib/content.php` and `admin/demo/demo-api.js` too.
- Optional `image` fields on `services[]` and `projects[]` are stored by the admin but not yet
  rendered by the front end (that is a front-end session task).
- After changing `admin.js`/`admin.css`, rebuild the demo with `python3 admin/demo/build-demo.py <dir>`.
