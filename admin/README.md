# Admin panel & back end

Admin panel for the RH Business Solutions website. Plain PHP 8.1+ with a **MySQL / MariaDB
database** (PDO, no Composer, no build step). Runs on **Hostinger** shared hosting and any
Apache/LiteSpeed host with PHP and MySQL.

| What | Where |
|---|---|
| Admin panel (UI) | `/admin/` → `admin/index.html`, `admin.css`, `admin.js` |
| API | `/api/<route>` → `admin/api.php?r=<route>` (rewrite in the root `.htaccess`) |
| Back-end modules | `admin/lib/core.php` (HTTP), `content.php` (content.js, validation, page sync), `db.php` (database, installer, two-step codes) |
| Database | tables `rh_settings` (content, settings), `rh_versions`, `rh_leads`, `rh_users`, `rh_activity`, `rh_throttle` |
| Database login | `admin/data/config.php`, written by the installer (blocked from the web, git-ignored) |
| Public website files | `assets/js/content.js`, `service-<id>.html`, `sitemap.xml` — written from the database on every save |
| Uploaded images | `assets/uploads/` (scripts blocked by its `.htaccess`) |
| Dev router | `admin/router.php` (only for `php -S`) |
| Shareable demo | `admin/demo/` — the real UI on an in-browser mock API |

## How changes reach the website

1. The owner edits content in the admin and presses **Save**.
2. The API validates it, keeps the old version in `rh_versions`, stores the new content in the
   database and immediately writes the public files: `assets/js/content.js`, pages for new or
   renamed services, `sitemap.xml`, and a `?v=<version>` on every page's `content.js` link so
   browsers and caches load the new content at once.
3. Visitors see the change on their next page load. No download, no re-upload, no build step.

The database is the source of truth. If the website files are ever replaced (for example when a
new version of the site is uploaded), the admin notices that `content.js` no longer matches the
database and writes it again the next time anyone opens the admin. *Versions → Re-publish
website now* does the same on demand.

## What the owner can do

- **Sign in** with password and optional **two-step verification** (Google Authenticator,
  Microsoft Authenticator, Authy).
- **Dashboard** — new leads, leads this week, requests by type, latest enquiries, quick links.
- **Leads inbox** — every Contact, Hire Staff and Partner With Us submission, stored in the database.
  Search, filter, status (new / contacted / done / archived), private notes, reply by email / call /
  WhatsApp, delete, **Export CSV**.
- **Website content** — every key of `window.SITE`: company details, logo, short address and
  **map location**, menu, home hero, stats, services (add / edit / delete / duplicate / reorder),
  recruitment items, work process, hiring steps, portfolio, sourcing countries, emirates,
  travel destinations. `**word**` highlights words in gold.
- **Images**, **Website preview** (desktop / phone), **Versions** (last 100, restore any).
- Owner only: **Users** (owners / editors, reset someone's two-step), **Activity log** (who changed
  what, failed sign-ins), **Settings** (email alert for new leads).

## Deploy on Hostinger

1. **Create the database**: hPanel → *Databases* → *Management* → create a MySQL database and
   user. Note the database name, user and password (Hostinger adds a prefix like `u123456789_`).
2. **Upload the site** to `public_html/` (File Manager: upload the ZIP and extract it). Include the
   hidden `.htaccess` files.
3. **PHP version**: hPanel → *Advanced* → *PHP Configuration* → 8.1 or newer.
4. **SSL**: enable the free SSL certificate, then uncomment the two HTTPS lines in `.htaccess`.
5. Open `https://your-domain/admin/` straight away. The installer asks for the database details
   and creates the owner account. It runs only once.
6. In the admin: *My account* → turn on **two-step verification**; *Settings* → lead alert email.

### Updating the site files later

Upload the new files as usual. Live content is safe in the database: when you next open the admin
it rewrites `content.js` from the database automatically. Uploaded images in `assets/uploads/`
are not touched by an update as long as you don't delete that folder.

### Backups

Hostinger backs up files and databases (hPanel → *Files* → *Backups*). The database holds
everything except images; keep `assets/uploads/` in your backups too.

### Lost phone (two-step verification)

Another owner can use *Users → Reset 2FA*. If there is no other owner: hPanel → *Databases* →
*phpMyAdmin* → table `rh_users` → set `totp_secret` to `NULL` for your account.

## Run locally

```bash
php -S localhost:8000 admin/router.php
```

The installer offers MySQL or, for quick local testing, an SQLite file (`admin/data/rh.sqlite`).

Site: http://localhost:8000/ · Admin: http://localhost:8000/admin/

## Shareable demo

```bash
python3 admin/demo/build-demo.py /tmp/rh-demo
```

Writes `index.html` (admin) and `site.html` (website preview). Publish both together; the demo
needs no server, and its data stays in the visitor's browser.

## Security notes

- Passwords: `password_hash` (bcrypt). Optional TOTP two-step verification (codes cannot be reused).
  Sessions: HttpOnly, `SameSite=Strict`, `Secure` on HTTPS, new session id on sign-in, 12-hour limit.
  Changing a password signs out other devices.
- Database: PDO prepared statements everywhere; the database password lives in
  `admin/data/config.php` (mode 0600, blocked by `.htaccess`). `admin/lib/` is blocked from the web.
- Activity log of saves, restores, sign-ins (including failed ones), user and setting changes.
- Every signed-in write needs JSON plus the `X-Requested-With: rh-admin` header (CSRF guard);
  cross-site origins are refused.
- Login: 8 failed attempts per IP + email → 15-minute lock. Forms: 10 submissions per IP per hour,
  a hidden honeypot field, length limits.
- Uploads: checked by image signature (`getimagesizefromstring`), random file names, no SVG,
  and the uploads folder refuses to run scripts.
- CSV export escapes formula characters. The admin pages send a strict Content-Security-Policy and
  `noindex`.
- Hosts that block `PUT`/`PATCH`/`DELETE` are handled: the UI sends `POST` + `X-Method`.

## API

All responses are JSON (`{ "error": "…" }` on failure).

| Method & route | Who | Purpose |
|---|---|---|
| `GET content` | public | Website content (same shape as `window.SITE`) |
| `POST leads` | public | Store a form submission `{ kind: general\|company\|agent, page, fields: {…} }` |
| `GET/POST auth/setup` | public | First-run installer: database + owner account |
| `POST auth/login` (`code` when two-step is on), `auth/logout`, `auth/password`; `GET auth/me` | | Sessions |
| `POST auth/2fa/start`, `auth/2fa/enable`, `auth/2fa/disable` | signed in | Two-step verification |
| `POST publish` | signed in | Rewrite the website files from the database |
| `GET dashboard` | signed in | Counts and latest leads |
| `PUT content` `{ content, base, force? }` | signed in | Save content (409 if someone saved since `base`) |
| `GET content/meta` · `GET history` · `POST history/<id>` | signed in | Save info, versions, restore |
| `GET leads` · `GET leads.csv` · `PATCH/DELETE leads/<id>` | signed in | Leads inbox |
| `GET/POST uploads` · `DELETE uploads/<name>` | signed in | Images |
| `GET/POST users` · `DELETE users/<id>` · `POST users/<id>/reset-2fa` | owner | Users |
| `GET activity` · `GET/PUT settings` | owner | Activity log, lead alert email |
