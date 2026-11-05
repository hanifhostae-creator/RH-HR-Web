/*
 * Builds every public HTML page from assets/js/content.js:
 *   - page shells with SEO tags (title, description, canonical, Open Graph, Twitter, JSON-LD)
 *   - one static page per service: service-<id>.html
 *   - sitemap.xml and robots.txt
 *   - pre-rendered page content inside each shell, so search engines and visitors
 *     without JavaScript see the full text (needs Playwright + Chromium)
 *
 * Usage:  node tools/build-site.js            (shells + prerender)
 *         node tools/build-site.js --no-render (shells only)
 * Set the live domain in SITE_URL before publishing.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const vm = require('vm');

const SITE_URL = 'https://rhmanagements.com';
const ROOT = path.resolve(__dirname, '..');

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/js/content.js'), 'utf8'), ctx);
const S = ctx.window.SITE, C = S.company;
const plain = (s) => String(s || '').replace(/\*\*/g, '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ORG_ID = SITE_URL + '/#organization';
const org = {
  '@type': 'EmploymentAgency',
  '@id': ORG_ID,
  name: C.name,
  alternateName: C.short,
  url: SITE_URL + '/',
  logo: SITE_URL + '/assets/img/favicon.svg',
  image: SITE_URL + '/assets/img/favicon.svg',
  description: C.intro,
  telephone: C.phone.replace(/\s/g, ''),
  email: C.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: C.address,
    addressLocality: 'Dubai',
    addressRegion: 'Dubai',
    addressCountry: 'AE'
  },
  areaServed: { '@type': 'Country', name: 'United Arab Emirates' },
  knowsAbout: S.services.map((x) => x.name),
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Services',
    itemListElement: S.services.map((x) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: x.name, description: plain(x.summary), url: `${SITE_URL}/service-${x.id}.html` } }))
  }
};
const crumbs = (list) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [['Home', '/']].concat(list).map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: SITE_URL + c[1] }))
});

const pages = [
  { file: 'index.html', page: 'home', title: `${C.name} | Recruitment & HR Solutions in Dubai, UAE`, desc: 'Recruitment agency in Dubai supplying skilled and unskilled workers from inside the UAE and from 40 countries across Africa and Asia — plus visas, travel, business setup, web development and marketing.', ld: [org, { '@type': 'WebSite', name: C.short, url: SITE_URL + '/', publisher: { '@id': ORG_ID } }] },
  { file: 'about.html', page: 'about', title: `About Us | ${C.short}, Dubai`, desc: 'A Dubai-based recruitment and HR solutions company with business setup, travel, development and marketing services. Learn who we are and how we work.', ld: [crumbs([['About Us', '/about.html']])] },
  { file: 'services.html', page: 'services', title: `Recruitment, HR & Business Services in Dubai | ${C.short}`, desc: 'Inside and outside recruitment, bulk manpower supply, HR solutions, business setup, travel & tour, web development, SEO, management and e-commerce in the UAE.', ld: [crumbs([['Services', '/services.html']])] },
  { file: 'portfolio.html', page: 'portfolio', title: `Portfolio | ${C.short}`, desc: 'Projects across recruitment drives, company formation, web development, e-commerce and digital marketing.', ld: [crumbs([['Portfolio', '/portfolio.html']])] },
  { file: 'contact.html', page: 'contact', title: `Contact Us | ${C.short}, Al Nahda Dubai`, desc: `Call ${C.phone}, email ${C.email} or visit our office at ${C.addressShort || C.address}.`, ld: [crumbs([['Contact Us', '/contact.html']]), { '@type': 'ContactPage', name: 'Contact ' + C.short, url: SITE_URL + '/contact.html', about: { '@id': ORG_ID } }] },
  { file: 'hire-staff.html', page: 'hire', title: `Hire Staff in the UAE — Skilled & Unskilled Workers | ${C.short}`, desc: 'Request manpower for your company: skilled and unskilled workers, bulk hiring from inside and outside the UAE, with visa and joining support.', ld: [crumbs([['Hire Staff', '/hire-staff.html']])] },
  { file: 'partner-with-us.html', page: 'partner', title: `Partner With Us — Recruitment Agents | ${C.short}`, desc: 'Recruitment agents and agencies in Africa and Asia: partner with us to place your candidates with companies in the UAE.', ld: [crumbs([['Partner With Us', '/partner-with-us.html']])] }
].concat(S.services.map((x) => ({
  file: `service-${x.id}.html`, page: 'service', id: x.id,
  title: `${x.name} in Dubai, UAE | ${C.short}`,
  desc: `${plain(x.summary)} ${x.group === 'recruitment' ? 'Recruitment agency in Dubai, UAE.' : 'Based in Dubai, UAE.'}`.slice(0, 300),
  ld: [crumbs([['Services', '/services.html'], [x.name, `/service-${x.id}.html`]]), { '@type': 'Service', name: x.name, description: x.text, serviceType: x.short, areaServed: { '@type': 'Country', name: 'United Arab Emirates' }, provider: { '@id': ORG_ID }, url: `${SITE_URL}/service-${x.id}.html` }]
})));

function shell(p) {
  const url = p.file === 'index.html' ? SITE_URL + '/' : `${SITE_URL}/${p.file}`;
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': p.ld }).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#050914">
<meta name="format-detection" content="telephone=no">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(C.name)}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="en_AE">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(p.desc)}">
<meta name="geo.region" content="AE-DU">
<meta name="geo.placename" content="Dubai">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
<script type="application/ld+json">${ld}</script>
</head>
<body data-page="${p.page}"${p.id ? ` data-id="${p.id}"` : ''} id="top">
<a class="skip" href="#main">Skip to content</a>
<div id="header"><!--prerender:header--></div>
<main id="main"><!--prerender:main--></main>
<div id="footer"><!--prerender:footer--></div>
<script src="assets/js/content.js" defer></script>
<script src="assets/js/icons.js" defer></script>
<script src="assets/js/app.js" defer></script>
</body>
</html>
`;
}

for (const p of pages) fs.writeFileSync(path.join(ROOT, p.file), shell(p));
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${p.file === 'index.html' ? SITE_URL + '/' : SITE_URL + '/' + p.file}</loc><lastmod>${today}</lastmod><priority>${p.page === 'home' ? '1.0' : p.page === 'service' || p.page === 'hire' ? '0.9' : '0.7'}</priority></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /tools/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log('wrote', pages.length, 'pages + sitemap.xml + robots.txt');

if (process.argv.includes('--no-render')) process.exit(0);

/* ---------- prerender ---------- */
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0, async () => {
  const port = server.address().port;
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const tab = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await tab.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  for (const p of pages) {
    await tab.goto(`http://localhost:${port}/${p.file}`, { waitUntil: 'load' });
    await tab.waitForSelector('#main > *');
    const parts = await tab.evaluate(() => {
      document.querySelectorAll('.reveal').forEach((el) => { el.classList.remove('in'); el.style.transitionDelay = ''; });
      document.querySelectorAll('.tilt').forEach((el) => { el.classList.remove('tilt'); el.style.transform = ''; });
      const clean = (el) => el.innerHTML.replace(/ style=""/g, '').replace(/ class=""/g, '');
      return { header: clean(document.getElementById('header')), main: clean(document.getElementById('main')), footer: clean(document.getElementById('footer')) };
    });
    const file = path.join(ROOT, p.file);
    let html = fs.readFileSync(file, 'utf8');
    for (const k of ['header', 'main', 'footer']) html = html.replace(`<!--prerender:${k}-->`, parts[k]);
    fs.writeFileSync(file, html);
  }
  await browser.close(); server.close();
  console.log('prerendered', pages.length, 'pages');
});
