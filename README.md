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
| `service.html?id=<service-id>` | Service detail (one template for all 10 services) |
| `portfolio.html` | Portfolio with category filter |
| `contact.html` | Contact + map |
| `hire-staff.html` | Hiring request form (companies) |
| `partner-with-us.html` | Partnership form (recruitment agents) |

## Structure
- `assets/js/content.js` — **all website content** (company info, services, recruitment items, projects, countries, destinations). The admin panel will read/write this same structure.
- `assets/js/icons.js` — line icons and simplified flag drawings.
- `assets/js/app.js` — renders header, footer and every page from `window.SITE`; forms, menu, animations.
- `assets/css/style.css` — design system (navy / brand blue / gold, Plus Jakarta Sans).

Forms currently open the visitor's email app addressed to the company email; they can be connected to the admin backend later.
