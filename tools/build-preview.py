"""Bundle the site into one self-contained HTML file (hash-routed) for sharing a preview.

Usage: python3 tools/build-preview.py <output.html>
"""
import pathlib, sys

root = pathlib.Path(__file__).resolve().parent.parent
css = (root / "assets/css/style.css").read_text()
js = "".join((root / f"assets/js/{n}.js").read_text() + "\n" for n in ("content", "icons"))
app = (root / "assets/js/app.js").read_text()
out = f"""<title>RH Business Solutions</title>
<meta name="description" content="Recruitment and HR solutions in Dubai, UAE.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
{css}
body {{ background: var(--bg); }}
</style>
<div id="header"></div>
<main id="main"></main>
<div id="footer"></div>
<script>window.RH_SPA = true;</script>
<script>
{js}
</script>
<script>
{app}
</script>
"""
pathlib.Path(sys.argv[1]).write_text(out)
print("wrote", sys.argv[1], len(out), "bytes")
