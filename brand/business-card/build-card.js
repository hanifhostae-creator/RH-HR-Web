/*
 * RH Facilities — business card (print ready, 90 × 55 mm + 3 mm bleed = 96 × 61 mm)
 * Matches the website look: dark navy, brand blue, gold, Plus Jakarta Sans,
 * with a dotted Africa / Arabia / Asia map and routes to the UAE in the background.
 *
 * Usage: node brand/business-card/build-card.js
 * Output: brand/business-card/RH_Ateeq_Business_Card.pdf (+ PNG previews)
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DIR = __dirname;
const ROOT = path.resolve(DIR, '../..');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/js/icons.js'), 'utf8'), ctx);
const icon = ctx.window.icon, flagShapes = ctx.window.flagShapes;

/* ---------- card content (same as the original card) ---------- */
const CARD = {
  company: 'RH FACILITIES',
  sub: 'MANAGEMENT & BUSINESS SOLUTIONS',
  tagline: 'Smart Solutions. Stronger Business.',
  values: 'Efficiency. Reliability. Excellence.',
  web: 'www.rhmanagements.com',
  person: 'ATEEQ AHMAD',
  role: 'BUSINESS DEVELOPMENT COORDINATOR',
  phone: '+971 54 788 3136',
  email: 'ateeq@rhmanagements.com',
  services: [
    ['users', 'Recruitment'], ['briefcase', 'HR Solutions'],
    ['globe', 'Outside Recruitment'], ['trending', 'Business Setup & Marketing'],
    ['pin', 'Inside Recruitment'], ['code', 'Web & Software Development'],
    ['plane', 'Travel & Tour'], ['zap', 'Management & Claude AI']
  ]
};

/* ---------- vector dotted map (SVG, 10 units = 1 mm) ---------- */
const LAND = [
  [[-17, 21], [-16, 28], [-10, 30], [-6, 36], [3, 37], [10, 37], [11, 33], [15, 32], [20, 31], [25, 32], [32, 31], [34, 28], [37, 22], [39, 15], [43, 12], [51, 12], [49, 7], [44, 2], [40, -3], [40, -11], [36, -18], [35, -24], [32, -29], [27, -34], [19, -35], [17, -29], [12, -17], [13, -6], [9, -1], [9, 4], [4, 6], [-3, 5], [-8, 4], [-13, 8], [-17, 14]],
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
  [[35, 28], [39, 22], [43, 13], [45, 13], [52, 16], [56, 18], [59, 22], [56.5, 25], [56, 26.3], [55, 25.5], [52, 24], [50, 26], [48, 29], [47, 30], [44, 32], [39, 32], [35, 32]],
  [[36, 36], [44, 38], [48, 30], [51, 27], [57, 25.5], [62, 25], [67, 24], [70, 21], [73, 17], [77, 8], [80, 13], [80, 16], [87, 21], [90, 22], [92, 21], [94, 17], [97, 16], [98, 9], [100, 6], [104, 1], [103, 9], [105, 9], [109, 12], [108, 17], [106, 21], [110, 21], [117, 24], [121, 30], [122, 37], [121, 40], [125, 40], [126, 45], [36, 45]],
  [[-10, 36], [-9, 43], [-2, 43.5], [3, 43], [8, 44], [12, 44], [16, 41], [18, 40], [16, 38], [13, 41], [10, 44], [13, 45.5], [19, 42], [20, 40], [22, 37], [24, 38], [26, 41], [29, 41], [27, 37], [36, 36], [36, 45], [-10, 45]],
  [[80, 10], [82, 7], [81, 6], [80, 6], [79.8, 8]],
  [[95, 5], [98, 4], [104, -2], [106, -6], [102, -4], [96, 1]],
  [[105, -6], [114, -7], [114, -8.5], [106, -7.5]],
  [[109, 1], [110, -3], [116, -4], [119, 1], [117, 7], [113, 3]],
  [[120, 18], [122, 18], [124, 13], [126, 7], [125, 6], [122, 8], [120, 13]]
];
const ORIGINS = [['eg', 31.2, 30], ['et', 38.7, 9], ['ke', 36.8, -1.3], ['ug', 32.6, .3], ['ng', 7.5, 9.1], ['gh', -.2, 5.6], ['sn', -17.4, 14.7], ['za', 28, -26.2], ['tz', 39.3, -6.8], ['pk', 73, 33.7], ['in', 77.2, 28.6], ['np', 85.3, 27.7], ['bd', 90.4, 23.8], ['lk', 79.9, 6.9], ['ph', 121, 14.6], ['id', 106.8, -6.2]];
const UAE = [55.3, 25.2];

function inPoly(x, y, p) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    if (((p[i][1] > y) !== (p[j][1] > y)) && (x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0])) c = !c;
  }
  return c;
}
const PLANE = 'M12 0L4-2L-2-11L-5-11L-3-2L-8-1.5L-10-5L-12-5L-10 0L-12 5L-10 5L-8 1.5L-3 2L-5 11L-2 11L4 2Z';

function mapSVG({ ux, uy, sc, dotA, flags, routes = true }) {
  const W = 960, H = 610, P = (lon, lat) => [ux + (lon - UAE[0]) * sc, uy - (lat - UAE[1]) * sc];
  let s = `<svg class="map" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">`;
  s += `<defs><radialGradient id="uaeG"><stop offset="0" stop-color="#e8bd66" stop-opacity=".55"/><stop offset="1" stop-color="#e8bd66" stop-opacity="0"/></radialGradient></defs><g fill="#7f9dff" fill-opacity="${dotA}">`;
  const step = 9;
  for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) {
    const lon = UAE[0] + (x - ux) / sc, lat = UAE[1] - (y - uy) / sc;
    if (LAND.some((p) => inPoly(lon, lat, p))) s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.55"/>`;
  }
  s += '</g>';
  if (routes) ORIGINS.forEach(([code, lon, lat], i) => {
    const [x0, y0] = P(lon, lat);
    if (x0 < -40 || x0 > W + 40 || y0 < -40 || y0 > H + 40) return;
    const d = Math.hypot(ux - x0, uy - y0), cx = (x0 + ux) / 2, cy = (y0 + uy) / 2 - d * .3;
    s += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ux} ${uy}" fill="none" stroke="#e8bd66" stroke-opacity=".5" stroke-width="1.4" stroke-dasharray="4 5" stroke-linecap="round"/>`;
    if (flags) s += `<g opacity=".85">${flagShapes(code, x0 - 9, y0 - 6, 18, 12)}</g>`;
    else s += `<circle cx="${x0.toFixed(1)}" cy="${y0.toFixed(1)}" r="3" fill="#e8bd66" fill-opacity=".8"/>`;
    if (i % 3 === 0) {
      const t = .62, px = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * ux, py = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * uy;
      const ang = Math.atan2(2 * (1 - t) * (cy - y0) + 2 * t * (uy - cy), 2 * (1 - t) * (cx - x0) + 2 * t * (ux - cx)) * 180 / Math.PI;
      s += `<path d="${PLANE}" fill="#ffe7b0" transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${ang.toFixed(1)}) scale(.75)"/>`;
    }
  });
  s += `<circle cx="${ux}" cy="${uy}" r="70" fill="url(#uaeG)"/><circle cx="${ux}" cy="${uy}" r="22" fill="none" stroke="#e8bd66" stroke-opacity=".45" stroke-width="1.2"/><circle cx="${ux}" cy="${uy}" r="38" fill="none" stroke="#e8bd66" stroke-opacity=".2" stroke-width="1.2"/><circle cx="${ux}" cy="${uy}" r="6" fill="#e8bd66" stroke="#050914" stroke-width="2"/>`;
  return s + '</svg>';
}

const emblem = (size) => `<div class="emb" style="--s:${size}mm"><div class="emb-ring"></div><div class="emb-tile"><span class="emb-gloss"></span><span class="t3d" data-t="RH">RH</span></div></div>`;
const t3d = (text, cls) => `<span class="t3d ${cls || ''}" data-t="${text}">${text}</span>`;

const front = `<section class="card front">
  ${mapSVG({ ux: 470, uy: 255, sc: 8.2, dotA: .34, flags: false })}
  <div class="glow g1"></div><div class="glow g2"></div>
  <div class="brand">
    ${emblem(17)}
    <h1>${t3d(CARD.company, 'name')}</h1>
    <p class="sub">${CARD.sub.replace('&', '&amp;')}</p>
    <p class="tag">${CARD.tagline}</p>
  </div>
  <div class="panel">
    <h2><i></i>OUR SERVICES</h2>
    <ul>${CARD.services.map(([k, t]) => `<li><span class="tile">${icon(k)}</span><b>${t.replace('&', '&amp;')}</b></li>`).join('')}</ul>
  </div>
  <div class="bar"><span class="tile sm">${icon('globe')}</span><b>${CARD.web}</b><em></em><span>${CARD.values}</span></div>
</section>`;

const back = `<section class="card back">
  ${mapSVG({ ux: 905, uy: 178, sc: 8.2, dotA: .26, flags: false, routes: false })}
  <div class="glow g3"></div>
  <div class="side">
    ${emblem(15)}
    <h3>${t3d(CARD.company, 'name sm')}</h3>
    <p class="sub">${CARD.sub.replace('&', '&amp;')}</p>
    <p class="tag">${CARD.tagline}</p>
  </div>
  <div class="uae-flag"><svg viewBox="0 0 60 38">${flagShapes('ae', 0, 0, 60, 38)}<rect width="60" height="38" fill="url(#fs)"/><defs><linearGradient id="fs" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".5" stop-color="#000" stop-opacity=".15"/><stop offset="1" stop-color="#fff" stop-opacity=".2"/></linearGradient></defs></svg></div>
  <div class="person">
    <h1>${t3d(CARD.person, 'pname')}</h1>
    <p class="role">${CARD.role}</p>
    <i class="rule"></i>
    <ul class="ct">
      <li><span class="tile">${icon('phone')}</span><b>${CARD.phone}</b></li>
      <li><span class="tile">${icon('mail')}</span><b>${CARD.email}</b></li>
      <li><span class="tile">${icon('globe')}</span><b>${CARD.web}</b></li>
    </ul>
  </div>
</section>`;

const css = `
@page { size: 96mm 61mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #2a2f3a; }
body { font-family: "Plus Jakarta Sans", Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.card { position: relative; width: 96mm; height: 61mm; overflow: hidden; color: #eef2fb; page-break-after: always; break-after: page;
  background: radial-gradient(60mm 40mm at 85% 0%, #17306f 0%, transparent 70%), linear-gradient(150deg, #0c1838 0%, #070d22 55%, #050914 100%); }
.screen .card { margin: 6mm auto; box-shadow: 0 4mm 10mm rgba(0,0,0,.5); }
.map { position: absolute; inset: 0; width: 100%; height: 100%; }
.glow { position: absolute; border-radius: 50%; }
.g1 { width: 50mm; height: 50mm; left: -20mm; bottom: -28mm; background: radial-gradient(circle, rgba(220,170,72,.22), transparent 65%); }
.g2 { width: 60mm; height: 60mm; right: -22mm; top: -30mm; background: radial-gradient(circle, rgba(61,107,255,.35), transparent 65%); }
.g3 { width: 70mm; height: 70mm; left: -30mm; top: -20mm; background: radial-gradient(circle, rgba(61,107,255,.3), transparent 65%); }

/* 3D text: gold face over a stacked dark extrusion */
.t3d { position: relative; display: inline-block; color: transparent; white-space: nowrap; }
.t3d::before { content: attr(data-t); position: absolute; left: 0; top: 0; color: #3a2508;
  text-shadow: 0 .12mm 0 #8f6219, 0 .24mm 0 #7a5214, 0 .36mm 0 #654310, 0 .48mm 0 #50340c, 0 .9mm .9mm rgba(0,0,0,.6); }
.t3d::after { content: attr(data-t); position: absolute; left: 0; top: 0; color: #f0c766; text-shadow: 0 -.08mm 0 #fff1c4; }
.t3d.name::after { color: #ffffff; text-shadow: 0 -.08mm 0 #ffffff; }
.t3d.name::before { color: #0a1430; text-shadow: 0 .12mm 0 #3c5bb8, 0 .24mm 0 #2f4a9b, 0 .36mm 0 #233a7d, 0 .48mm 0 #18295c, 0 .9mm .9mm rgba(0,0,0,.6); }

/* 3D emblem */
.emb { position: relative; width: var(--s); height: var(--s); display: grid; place-items: center; }
.emb-ring { position: absolute; inset: -2.2mm; border-radius: 50%; border: .35mm solid transparent;
  background: linear-gradient(#0000, #0000) padding-box, conic-gradient(from 200deg, #e8bd66, #3d6bff, #8aa8ff, #e8bd66, #b17a22, #e8bd66) border-box;
  -webkit-mask: linear-gradient(#000 0 0) padding-box exclude, linear-gradient(#000 0 0) border-box; mask: linear-gradient(#000 0 0) padding-box exclude, linear-gradient(#000 0 0) border-box; opacity: .9; }
.emb-tile { position: relative; width: 100%; height: 100%; border-radius: 28%; overflow: hidden; display: grid; place-items: center;
  background: linear-gradient(150deg, #2a4597 0%, #142a6b 45%, #0a1430 100%);
  box-shadow: inset 0 .25mm 0 rgba(255,255,255,.45), inset 0 0 0 .25mm rgba(232,189,102,.75), inset 0 -2mm 3mm rgba(0,0,0,.45), 0 1.4mm 0 #070d22, 0 1.6mm 0 rgba(232,189,102,.4), 0 3mm 4mm rgba(0,0,0,.6); }
.emb-gloss { position: absolute; left: 7%; right: 7%; top: 4%; height: 46%; border-radius: 30% 30% 50% 50%; background: linear-gradient(180deg, rgba(255,255,255,.32), rgba(255,255,255,0)); }
.emb .t3d { font-weight: 800; font-size: calc(var(--s) * .44); letter-spacing: -.02em; line-height: 1; }

.tile { width: 3.6mm; height: 3.6mm; border-radius: 1mm; flex: none; display: grid; place-items: center; position: relative; overflow: hidden; color: #fff;
  background: linear-gradient(150deg, rgba(122,156,255,.85), rgba(61,107,255,.45) 55%, #142252);
  box-shadow: inset 0 .15mm 0 rgba(255,255,255,.55), 0 .5mm .9mm rgba(0,0,0,.55); }
.tile::before { content: ""; position: absolute; left: 8%; right: 8%; top: 4%; height: 45%; border-radius: .8mm .8mm 50% 50%; background: linear-gradient(180deg, rgba(255,255,255,.4), transparent); }
.tile svg { position: relative; width: 58%; height: 58%; stroke-width: 2.1; }
.tile.sm { width: 3.4mm; height: 3.4mm; }

/* front */
.brand { position: absolute; left: 7.5mm; top: 8.5mm; width: 40mm; display: flex; flex-direction: column; align-items: flex-start; }
.brand .emb { margin: 2.2mm 0 0 2.2mm; }
.brand h1 { margin-top: 4.6mm; font-size: 4.25mm; font-weight: 800; letter-spacing: .01em; line-height: 1.1; }
.sub { margin-top: 1mm; font-size: 1.72mm; font-weight: 700; letter-spacing: .07em; color: #e8bd66; line-height: 1.25; }
.tag { margin-top: 1.6mm; padding-top: 1.4mm; border-top: .2mm solid rgba(232,189,102,.45); font-size: 1.85mm; font-weight: 500; color: rgba(225,232,250,.85); }
.panel { position: absolute; left: 49.5mm; top: 7mm; width: 39.5mm; padding: 2.6mm 2.6mm 2.2mm; border-radius: 2.4mm;
  background: linear-gradient(165deg, rgba(255,255,255,.1), rgba(255,255,255,.02) 50%), rgba(8,14,34,.78);
  box-shadow: inset 0 .2mm 0 rgba(255,255,255,.2), inset 0 0 0 .2mm rgba(140,170,255,.25), 0 1.5mm 3mm rgba(0,0,0,.5); }
.panel h2 { display: flex; align-items: center; gap: 1.4mm; font-size: 2.1mm; font-weight: 800; letter-spacing: .14em; color: #e8bd66; margin-bottom: 2.2mm; }
.panel h2 i { width: 4mm; height: .35mm; background: #e8bd66; border-radius: .2mm; }
.panel ul { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 1.9mm 1.6mm; }
.panel li { display: flex; align-items: center; gap: 1.2mm; }
.panel li b { font-size: 1.72mm; font-weight: 700; line-height: 1.2; color: #f1f4fb; }
.bar { position: absolute; left: 7.5mm; right: 7.5mm; bottom: 6.6mm; height: 6mm; padding: 0 2.4mm; border-radius: 1.6mm; display: flex; align-items: center; gap: 1.5mm;
  background: linear-gradient(90deg, rgba(220,170,72,.24), rgba(61,107,255,.18) 60%, rgba(61,107,255,.08)); box-shadow: inset 0 0 0 .2mm rgba(232,189,102,.4), inset 0 .2mm 0 rgba(255,255,255,.18); }
.bar b { font-size: 1.95mm; font-weight: 700; color: #fff; }
.bar em { width: .2mm; height: 3mm; background: rgba(232,189,102,.6); margin: 0 1mm; }
.bar span:last-child { font-size: 1.85mm; font-weight: 600; color: #e8bd66; letter-spacing: .02em; }

/* back */
.side { position: absolute; left: 0; top: 0; bottom: 0; width: 40mm; padding: 9mm 0 0 7.5mm; display: flex; flex-direction: column; align-items: flex-start;
  background: linear-gradient(160deg, rgba(23,44,104,.92), rgba(8,14,34,.94)); clip-path: polygon(0 0, 100% 0, 86% 100%, 0 100%);
  box-shadow: inset -.3mm 0 0 rgba(232,189,102,.5); }
.back::after { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 40.6mm; background: linear-gradient(180deg, #e8bd66, #3d6bff); clip-path: polygon(99% 0, 100% 0, 86.6% 100%, 85.6% 100%); }
.side .emb { margin: 2mm 0 0 2mm; }
.side h3 { margin-top: 4.4mm; font-size: 3.3mm; font-weight: 800; line-height: 1.1; }
.side .sub { font-size: 1.55mm; max-width: 27mm; }
.side .tag { font-size: 1.55mm; max-width: 30mm; }
.uae-flag { position: absolute; right: 6.5mm; top: 7mm; width: 9mm; height: 5.7mm; border-radius: .5mm; overflow: hidden; transform: perspective(20mm) rotateY(-18deg); box-shadow: 0 .8mm 1.5mm rgba(0,0,0,.6); }
.uae-flag svg { width: 100%; height: 100%; display: block; }
.person { position: absolute; left: 44.5mm; top: 13mm; right: 6.5mm; }
.person h1 { font-size: 4.9mm; font-weight: 800; letter-spacing: .02em; line-height: 1.15; }
.role { margin-top: 1.2mm; font-size: 1.75mm; font-weight: 700; letter-spacing: .09em; color: #c9d6ff; }
.rule { display: block; width: 12mm; height: .4mm; margin: 2.6mm 0 3.2mm; border-radius: .2mm; background: linear-gradient(90deg, #e8bd66, #3d6bff); }
.ct { list-style: none; display: grid; gap: 2.1mm; }
.ct li { display: flex; align-items: center; gap: 2mm; }
.ct .tile { width: 4.4mm; height: 4.4mm; border-radius: 1.2mm; }
.ct b { font-size: 2.15mm; font-weight: 600; color: #f1f4fb; letter-spacing: .01em; }
`;

const html = (screen) => `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${css}</style></head><body class="${screen ? 'screen' : ''}">${front}${back}</body></html>`;

fs.writeFileSync(path.join(DIR, 'card.html'), html(true));
fs.writeFileSync(path.join(DIR, 'card-print.html'), html(false));

(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1000, height: 700 }, deviceScaleFactor: 4 });
  await p.goto('file://' + path.join(DIR, 'card-print.html'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const fontOk = await p.evaluate(() => document.fonts.check('800 12px "Plus Jakarta Sans"'));
  await p.pdf({ path: path.join(DIR, 'RH_Ateeq_Business_Card.pdf'), width: '96mm', height: '61mm', printBackground: true, preferCSSPageSize: true });
  const cards = await p.$$('.card');
  await cards[0].screenshot({ path: path.join(DIR, 'preview-front.png') });
  await cards[1].screenshot({ path: path.join(DIR, 'preview-back.png') });
  await b.close();
  console.log('font loaded:', fontOk, '— wrote PDF and previews');
})();
