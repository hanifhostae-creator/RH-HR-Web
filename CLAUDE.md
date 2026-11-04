# RH Business Solutions & Marketing Management — Website

Company website for a Dubai recruitment & HR solutions company (also business setup,
travel & tour, web development, marketing, management, e-commerce).

## How work is split between sessions

This project is built in **separate Claude Code sessions**. Stay inside the scope of the
session you are in.

| Session | Scope | Folder |
|---|---|---|
| **Front end** (public website) | Pages, design, animations, responsive layout | repo root: `*.html`, `assets/` |
| **Admin panel + back end** | Admin dashboard, login, API/database, saving content, form submissions | `admin/` (see `admin/CLAUDE.md`) |

- A front-end session must **not** build the admin panel, a server, a database or auth.
- An admin/back-end session must **not** redesign public pages. It may only change the
  front end where needed to load content from the API (see "Content contract").

## Front end — structure

Static site, no build step, no framework. Serve with `python3 -m http.server 8000`.

- `index.html`, `about.html`, `services.html`, `service.html?id=<id>`, `portfolio.html`,
  `contact.html`, `hire-staff.html`, `partner-with-us.html` — thin shells; each sets
  `<body data-page="...">` and loads the three scripts.
- `assets/js/content.js` — **all site content** as `window.SITE` (single source of truth).
- `assets/js/icons.js` — `icon(name)` line icons, `flag(code)` / `flagShapes()` / `flagParts()`.
- `assets/js/app.js` — renders header, footer and each page from `window.SITE`; hero map
  canvas, 3D hero icon, background effects, 3D card tilt, forms.
- `assets/css/style.css` — design tokens on `:root` (dark navy, brand blue `--brand`, gold `--gold`,
  font Plus Jakarta Sans) and all styles.
- `tools/build-preview.py <out.html>` — bundles everything into one hash-routed file
  (`#about`, `#service-<id>`) used for the shareable preview link.

Conventions: vanilla ES5-style JS (no modules), escape user text with `esc()`, keep
`prefers-reduced-motion` support, keep phone width (390px) free of horizontal scroll.

## Content contract (shared with the admin panel)

`window.SITE` keys: `company`, `nav`, `hero` (`words[]` with `icon`, `text`, `color`), `stats`,
`recruitmentItems`, `process`, `hiringSteps`, `services[]` (`id`, `group`, `icon`, `name`,
`short`, `summary`, `text`, `points[]`, `tags[]`, `visual`), `projects`, `sourcing`
(`africa[]`/`asia[]` as `[flagCode, name, lon, lat]`), `emirates`, `destinations`.

Do not rename keys without updating both the front end and the admin panel.
Forms currently open the visitor's email app (`mailto:`); the back end will replace this.
