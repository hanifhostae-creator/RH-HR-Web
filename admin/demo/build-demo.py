"""Build the shareable admin demo: the real admin UI running on an in-browser mock API.

Usage: python3 admin/demo/build-demo.py <out-dir>
Writes <out-dir>/index.html (admin page, published as the artifact page) and
<out-dir>/site.html (the website preview, reading the content edited in the demo).
Nothing in the demo talks to a server; data stays in the viewer's browser.
"""
import pathlib, sys

root = pathlib.Path(__file__).resolve().parents[2]
out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
read = lambda p: (root / p).read_text()
content, icons, app, css = read("assets/js/content.js"), read("assets/js/icons.js"), read("assets/js/app.js"), read("assets/css/style.css")
admin_css, admin_js, api = read("admin/admin.css"), read("admin/admin.js"), read("admin/demo/demo-api.js")
fonts = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">'
safe = lambda js: js.replace("</script", "<\\/script")

(out / "index.html").write_text(f"""<meta charset="utf-8">
<title>RH Admin Panel</title>
<meta name="robots" content="noindex">
{fonts}
<style>
{admin_css}
.demo-bar {{ position: relative; z-index: 30; display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; justify-content: center; padding: 8px max(16px, env(safe-area-inset-left, 0px)); background: var(--gold-50); border-bottom: 1px solid rgba(220, 170, 72, .3); color: var(--ink); font-size: .82rem; }}
.demo-bar b {{ color: var(--gold); }}
.demo-bar button {{ background: none; border: 1px solid rgba(220, 170, 72, .45); color: var(--gold); border-radius: 8px; padding: 3px 10px; font-weight: 700; font-size: .78rem; cursor: pointer; }}
.side {{ height: 100%; min-height: 100vh; }}
</style>
<div class="demo-bar"><span><b>Demo</b> · every edit works, but it is saved only in this browser. The live site saves to the server.</span><button type="button" id="demoReset">Reset demo data</button></div>
<div id="app" class="boot">Loading…</div>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
<script>window.RH_DEMO = true; window.RH_API = 'demo-api/'; window.RH_SITE = 'site.html';</script>
<script>
{safe(content)}
window.RH_SEED_CONTENT = window.SITE;
</script>
<script>
{safe(api)}
</script>
<script>
{safe(icons)}
</script>
<script>
{safe(admin_js)}
</script>
<script>
(function () {{
  var b = document.getElementById('demoReset'), armed = false;
  b.addEventListener('click', function () {{
    if (!armed) {{ armed = true; b.textContent = 'Click again to reset'; setTimeout(function () {{ armed = false; b.textContent = 'Reset demo data'; }}, 3000); return; }}
    window.RH_DEMO_RESET();
  }});
}})();
</script>
""")

(out / "site.html").write_text(f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>RH Business Solutions — preview</title>
{fonts}
<style>
{css}
body {{ background: var(--bg); }}
</style>
</head>
<body>
<div id="header"></div>
<main id="main"></main>
<div id="footer"></div>
<script>window.RH_SPA = true; window.RH_DEMO = true;</script>
<script>
{safe(content)}
window.RH_SEED_CONTENT = window.SITE;
</script>
<script>
{safe(api)}
try {{ var saved = localStorage.getItem('rh-demo-content'); if (saved) window.SITE = JSON.parse(saved); }} catch (e) {{}}
</script>
<script>
{safe(icons)}
</script>
<script>
{safe(app)}
</script>
</body>
</html>
""")
print("wrote", out / "index.html", "and", out / "site.html")
