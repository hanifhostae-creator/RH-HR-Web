# Admin panel & back end

Admin panel for the RH Business Solutions website. Plain PHP 8.1+ with JSON files:
no database, no Composer and no build step, so it runs on **Hostinger** shared hosting
(and any Apache/LiteSpeed host with PHP).

| What | Where |
|---|---|
| Admin panel (UI) | `/admin/` → `admin/index.html`, `admin.css`, `admin.js` |
| API | `/api/<route>` → `admin/api.php?r=<route>` (rewrite in the root `.htaccess`) |
| Website content | `assets/js/content.js` (`window.SITE`) — read and rewritten by the API |
| Uploaded images | `assets/uploads/` (scripts blocked by its `.htaccess`) |
| Private data | `admin/data/` — `users.json`, `leads.json`, `meta.json`, `history/` (blocked from the web, git-ignored) |
| Dev router | `admin/router.php` (only for `php -S`) |
| Shareable demo | `admin/demo/` — the real UI on an in-browser mock API |

## What the owner can do

- **Sign in** — the first visit to `/admin/` creates the owner account. Owners add editors under *Users*.
- **Dashboard** — new leads, leads this week, requests by type, latest enquiries, quick links.
- **Leads inbox** — every Contact, Hire Staff and Partner With Us submission. Search, filter,
  status (new / contacted / done / archived), private notes, reply by email / call / WhatsApp,
  delete, **Export CSV**.
- **Website content** — every key of `window.SITE`: company details & logo, menu, home hero
  (rotating words with icon + colour), stats, services (add / edit / delete / duplicate / reorder,
  points, tags, icon, picture, photo), recruitment items, work process, hiring steps, portfolio,
  sourcing countries (flag, name, map position), emirates, travel destinations.
  `**word**` highlights words in gold (live preview under the field).
- **Images** — upload PNG / JPG / WebP / GIF (max 5 MB), pick them for the logo, services and projects.
- **Website preview** — the real site inside the admin, desktop or phone width.
- **Versions** — a copy of the content is kept on every save (last 50); restore any of them.

Saving rewrites `assets/js/content.js`, so the public pages show the change immediately.
It also creates `service-<id>.html` for new services, refreshes the SEO tags of every
service page, removes pages of deleted services and updates `sitemap.xml`.

## Deploy on Hostinger

1. **Upload the site** to `public_html/` (hPanel → *Files* → *File Manager*, or *Advanced* → *Git*
   to deploy this repository). Upload hidden files too: `.htaccess`, `admin/.htaccess`,
   `assets/uploads/.htaccess`.
2. **PHP version**: hPanel → *Advanced* → *PHP Configuration* → 8.1 or newer (8.2/8.3 recommended).
3. **SSL**: enable the free SSL certificate, then uncomment the two HTTPS lines at the top of `.htaccess`.
4. Open `https://your-domain/admin/` and **create the owner account** (do this right after uploading).
5. *Optional* e-mail alert for every new lead: create `admin/data/notify.txt` containing the
   address (e.g. `info@rhmanagements.com`). It uses PHP `mail()`, which Hostinger supports.
6. Set the live domain in `tools/build-site.js` (`SITE_URL`) before building the pages.

Folders the server must be able to write (the Hostinger defaults are fine):
`assets/js/`, `assets/uploads/`, `admin/data/`, the site root (`service-*.html`, `sitemap.xml`).

> **Git deploys and live edits.** Edits made in the admin panel change `assets/js/content.js`
> on the server. If you later redeploy from Git, that file is replaced with the repository's copy.
> Before redeploying, download the live `content.js` into the repository (or restore it afterwards
> from *Versions*).

### Full SEO rebuild (optional)

Saving keeps titles, descriptions, JSON-LD and the sitemap of service pages current. The other
pages keep the pre-rendered text from the last `node tools/build-site.js`; visitors always see
the live content because `app.js` renders every page from `content.js`. To refresh the
pre-rendered text for search engines after big content changes: download the live
`assets/js/content.js`, run `node tools/build-site.js` locally, and upload the generated `*.html`
and `sitemap.xml`.

## Run locally

```bash
php -S localhost:8000 admin/router.php
```

Site: http://localhost:8000/ · Admin: http://localhost:8000/admin/

## Shareable demo

```bash
python3 admin/demo/build-demo.py /tmp/rh-demo
```

Writes `index.html` (admin) and `site.html` (website preview). Publish both together; the demo
needs no server, and its data stays in the visitor's browser.

## Security notes

- Passwords: `password_hash` (bcrypt). Sessions: HttpOnly, `SameSite=Strict`, `Secure` on HTTPS,
  new session id on sign-in, 12-hour limit. Changing a password signs out other devices.
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
| `GET/POST auth/setup` | public | First-run owner account |
| `POST auth/login`, `auth/logout`, `auth/password`; `GET auth/me` | | Sessions |
| `GET dashboard` | signed in | Counts and latest leads |
| `PUT content` `{ content, base, force? }` | signed in | Save content (409 if someone saved since `base`) |
| `GET content/meta` · `GET history` · `POST history/<id>` | signed in | Save info, versions, restore |
| `GET leads` · `GET leads.csv` · `PATCH/DELETE leads/<id>` | signed in | Leads inbox |
| `GET/POST uploads` · `DELETE uploads/<name>` | signed in | Images |
| `GET/POST users` · `DELETE users/<id>` | owner | Users |
