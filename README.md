# RH Business Solutions & Marketing Management — Website (Front end)

Static, dependency-free website. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Pages
| File | Page |
|---|---|
| `index.html` | Home |
| `about.html` | About Us |
| `services.html` | All services |
| `service-<service-id>.html` | Service detail page (one per service) |
| `portfolio.html` | Portfolio with category filter |
| `contact.html` | Contact + map |
| `hire-staff.html` | Hiring request form (companies) |
| `partner-with-us.html` | Partnership form (recruitment agents) |

## Structure
- `assets/js/content.js` — **all website content** (company info, services, recruitment items, projects, countries, destinations). The admin panel will read/write this same structure.
- `assets/js/icons.js` — line icons and simplified flag drawings.
- `assets/js/app.js` — renders header, footer and every page from `window.SITE`; forms, menu, animations.
- `assets/css/style.css` — design system (navy / brand blue / gold, Plus Jakarta Sans).

Forms send submissions to the admin leads inbox (`api/leads`), falling back to the visitor's email app when the API is not available.

## Admin panel
`/admin/` — PHP back end, runs on Hostinger shared hosting. Local: `php -S localhost:8000 admin/router.php`. See `admin/README.md`.

## Shareable preview
`python3 tools/build-preview.py preview.html` bundles everything into one hash-routed HTML file
(`#about`, `#service-outside-recruitment`, …) for sharing a preview link.

## Build (SEO)
`node tools/build-site.js` regenerates every page from `assets/js/content.js` with titles, meta
descriptions, canonical URLs, Open Graph tags, JSON-LD (EmploymentAgency, Service, Breadcrumbs),
pre-rendered content, `sitemap.xml` and `robots.txt`. Set `SITE_URL` in the script to the live domain.
