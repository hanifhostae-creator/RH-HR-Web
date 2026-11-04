# Admin panel & back end — separate session

This folder is reserved for the **admin panel and back end**, built in its own Claude Code
session. The public website (front end) lives in the repo root and is built in a different
session — read `../CLAUDE.md` first.

## Goal

Let the site owner manage everything on the public website without editing code.

## Expected scope (to be designed in the admin session)

- Secure login for the owner/editors.
- Dashboard with counts and quick actions.
- Edit every key of the content contract in `../assets/js/content.js` (`window.SITE`):
  company details & logo, menu, hero words, stats, services (add/edit/delete, points, tags,
  icon, colour), recruitment items, work process, hiring steps, portfolio projects,
  sourcing countries, emirates, travel destinations.
- Image uploads (logo, service and project pictures).
- Store submissions from the Contact, Hire Staff and Partner With Us forms, with a
  leads inbox (replace the current `mailto:` behaviour in `../assets/js/app.js`).
- An API the front end reads content from (keep the same JSON shape as `window.SITE`,
  so `app.js` only needs to load it instead of `content.js`).

## Rules for the admin session

- Keep all admin and server code inside `admin/` (plus any config the stack needs).
- Do not redesign the public pages; match their dark navy / blue / gold look in the admin UI.
- Keep the content keys stable; if a key must change, update `../assets/js/app.js` too.
