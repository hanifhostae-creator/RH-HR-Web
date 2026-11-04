/* RH Business Solutions — front end
 * Renders the shared header/footer and each page from window.SITE (content.js).
 */
(function () {
  'use strict';
  var S = window.SITE, C = S.company, I = window.icon;
  var page = document.body.getAttribute('data-page') || 'home';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function svc(id) { return S.services.filter(function (x) { return x.id === id; })[0]; }
  function svcUrl(x) { return 'service.html?id=' + encodeURIComponent(x.id); }
  function tel() { return 'tel:' + C.phone.replace(/[^+\d]/g, ''); }
  function group(g) { return S.services.filter(function (x) { return x.group === g; }); }
  function arrow() { return I('arrow', 'ic-sm'); }
  function btn(href, label, cls, ic) { return '<a class="btn ' + (cls || '') + '" href="' + href + '">' + label + (ic === false ? '' : arrow()) + '</a>'; }
  function head(eyebrow, title, text, center) {
    return '<div class="sec-head' + (center ? ' center' : '') + ' reveal"><span class="eyebrow">' + esc(eyebrow) + '</span><h2>' + title + '</h2>' + (text ? '<p>' + esc(text) + '</p>' : '') + '</div>';
  }
  function ticks(list, cls) { return '<ul class="ticks ' + (cls || '') + '">' + list.map(function (t) { return '<li>' + I('check') + '<span>' + esc(t) + '</span></li>'; }).join('') + '</ul>'; }
  function logoMark() { return C.logo ? '<img src="' + esc(C.logo) + '" alt="">' : '<span>RH</span>'; }
  function crumbs(list) {
    return '<nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a>' + list.map(function (c) { return '<span>/</span>' + (c[1] ? '<a href="' + c[1] + '">' + esc(c[0]) + '</a>' : '<b>' + esc(c[0]) + '</b>'); }).join('') + '</nav>';
  }
  function pageHero(eyebrow, title, text, trail, side) {
    return '<section class="page-hero"><div class="wrap' + (side ? ' ph-split' : '') + '"><div>' + crumbs(trail) + '<span class="eyebrow light">' + esc(eyebrow) + '</span><h1>' + esc(title) + '</h1>' + (text ? '<p class="lead">' + esc(text) + '</p>' : '') + '</div>' + (side || '') + '</div></section>';
  }

  /* ---------- header ---------- */
  function header() {
    var drop = '<div class="dd"><div class="dd-col"><h6>Recruitment & HR</h6>' + group('recruitment').map(ddItem).join('') + '</div><div class="dd-col"><h6>Business & Digital</h6>' + group('business').map(ddItem).join('') + '</div><a class="dd-all" href="services.html">View all services ' + arrow() + '</a></div>';
    function ddItem(x) { return '<a href="' + svcUrl(x) + '"><i>' + I(x.icon) + '</i><span><b>' + esc(x.short) + '</b><small>' + esc(x.summary) + '</small></span></a>'; }
    var links = S.nav.map(function (n) {
      var on = n.page === page || (page === 'service' && n.page === 'services');
      if (n.dropdown) return '<div class="has-dd"><a href="' + n.href + '" class="' + (on ? 'on' : '') + '">' + esc(n.label) + I('chevron', 'ic-xs') + '</a>' + drop + '</div>';
      return '<a href="' + n.href + '" class="' + (on ? 'on' : '') + '">' + esc(n.label) + '</a>';
    }).join('');
    return '<div class="topbar"><div class="wrap"><div class="tb-l"><a href="' + tel() + '">' + I('phone', 'ic-xs') + esc(C.phone) + '</a><a href="mailto:' + esc(C.email) + '">' + I('mail', 'ic-xs') + esc(C.email) + '</a></div><div class="tb-r">' + I('pin', 'ic-xs') + '<span>Al Nahda 1, Dubai · Mai Tower, 5th Floor</span></div></div></div>' +
      '<header class="site-header" id="hdr"><div class="wrap hdr-in"><a class="brand" href="index.html" aria-label="' + esc(C.short) + ' home"><span class="mark">' + logoMark() + '</span><span class="brand-t"><b>' + esc(C.short) + '</b><small>' + esc(C.sub) + '</small></span></a>' +
      '<nav class="main-nav" id="nav" aria-label="Main">' + links + '<div class="nav-cta-m">' + btn('partner-with-us.html', 'Partner With Us', 'btn-ghost', false) + btn('hire-staff.html', 'Hire Staff', 'btn-primary') + '</div></nav>' +
      '<div class="hdr-cta">' + btn('partner-with-us.html', 'Partner With Us', 'btn-ghost', false) + btn('hire-staff.html', 'Hire Staff', 'btn-primary') + '</div>' +
      '<button class="burger" id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="nav">' + I('menu') + '</button></div></header>';
  }

  /* ---------- footer ---------- */
  function footer() {
    return '<footer class="site-footer"><div class="wrap">' +
      '<div class="f-cta reveal"><div><span class="eyebrow light">Get started</span><h3>Ready to hire or plan a trip?</h3><p>Talk to our team today — we reply quickly.</p></div><div class="f-cta-b">' + btn('hire-staff.html', 'Hire Staff', 'btn-gold') + btn('partner-with-us.html', 'Partner With Us', 'btn-outline-light', false) + '</div></div>' +
      '<div class="f-grid"><div class="f-about"><a class="brand light" href="index.html"><span class="mark">' + logoMark() + '</span><span class="brand-t"><b>' + esc(C.short) + '</b><small>' + esc(C.sub) + '</small></span></a><p>' + esc(C.footer) + '</p><div class="f-tags"><span>Recruitment</span><span>HR Solutions</span><span>Travel & Tour</span><span>Business Setup</span></div></div>' +
      '<div><h5>Company</h5><a href="index.html">Home</a><a href="about.html">About Us</a><a href="portfolio.html">Portfolio</a><a href="hire-staff.html">Hire Staff</a><a href="partner-with-us.html">Partner With Us</a><a href="contact.html">Contact Us</a></div>' +
      '<div><h5>Services</h5>' + S.services.map(function (x) { return '<a href="' + svcUrl(x) + '">' + esc(x.short) + '</a>'; }).join('') + '</div>' +
      '<div><h5>Get in touch</h5><a class="f-ct" href="' + tel() + '">' + I('phone') + '<span>' + esc(C.phone) + '</span></a><a class="f-ct" href="mailto:' + esc(C.email) + '">' + I('mail') + '<span>' + esc(C.email) + '</span></a><div class="f-ct">' + I('pin') + '<span>' + esc(C.address) + '</span></div></div></div>' +
      '<div class="f-bottom"><span>' + esc(C.copyright) + '</span><a href="#top" id="totop">Back to top ↑</a></div></div></footer>';
  }

  /* ---------- visuals ---------- */
  var DOTS = '<defs><pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1" fill="currentColor" opacity=".18"/></pattern></defs>';

  function worldMap(compact) {
    var A = { eg: [190, 70], ma: [78, 64], sn: [40, 138], ml: [100, 118], gn: [58, 186], sl: [86, 228], gh: [128, 196], cm: [170, 214], et: [232, 150], ke: [222, 214], rw: [188, 254] },
      B = { pk: [430, 78], np: [500, 66], in: [462, 140], bd: [540, 118], lk: [478, 232], id: [574, 284], ph: [606, 176] },
      U = [322, 146], s = '<svg class="map" viewBox="0 0 640 340" role="img" aria-label="Recruitment routes from Africa and Asia to the UAE">' + DOTS + '<rect width="640" height="340" fill="url(#dots)"/>', i = 0, names = {};
    S.sourcing.africa.concat(S.sourcing.asia).forEach(function (c) { names[c[0]] = c[1]; });
    function route(code, p, labelRight) {
      var cx = (p[0] + U[0]) / 2, cy = Math.min(p[1], U[1]) - 56 - (i % 3) * 10, d = 'M' + p[0] + ' ' + p[1] + ' Q' + cx + ' ' + cy + ' ' + U[0] + ' ' + U[1];
      s += '<path class="rt" d="' + d + '"/>';
      s += '<circle r="2.6" class="mv"><animateMotion dur="' + (4.2 + (i % 4) * .7) + 's" begin="' + (i * .45) + 's" repeatCount="indefinite" path="' + d + '"/></circle>';
      s += '<g class="org"><title>' + esc(names[code] || '') + '</title>' + window.flagShapes(code, p[0] - 10, p[1] - 7, 20, 14) + '</g>';
      if (!compact && labelRight) { var lf = p[0] > 560; s += '<text class="lb" text-anchor="' + (lf ? 'end' : 'start') + '" x="' + (p[0] + (lf ? -14 : 14)) + '" y="' + (p[1] + 4) + '">' + esc(names[code]) + '</text>'; }
      i++;
    }
    Object.keys(A).forEach(function (k) { route(k, A[k], false); });
    Object.keys(B).forEach(function (k) { route(k, B[k], true); });
    s += '<text class="rg" x="40" y="318">AFRICA</text><text class="rg" x="430" y="318">ASIA</text>';
    s += '<circle class="pulse" cx="' + U[0] + '" cy="' + U[1] + '" r="10"/><circle class="uae" cx="' + U[0] + '" cy="' + U[1] + '" r="7"/>' +
      '<g transform="translate(' + (U[0] - 13) + ',' + (U[1] + 16) + ')">' + window.flagShapes('ae', 0, 0, 26, 17) + '</g><text class="ul" x="' + (U[0] - 16) + '" y="' + (U[1] + 50) + '">UAE</text>';
    return s + '</svg>';
  }

  function uaeMap() {
    var P = [[120, 230], [270, 150], [340, 112], [394, 90], [446, 72], [540, 46], [510, 168]], d = 'M120 230L270 150L340 112L394 90L446 72L540 46',
      s = '<svg class="map" viewBox="0 0 640 300" role="img" aria-label="Candidates across the seven Emirates">' + DOTS + '<rect width="640" height="300" fill="url(#dots)"/><path class="rt solid" d="' + d + 'M340 112L510 168"/><circle r="4" class="mv"><animateMotion dur="7s" repeatCount="indefinite" path="' + d + '"/></circle>';
    S.emirates.forEach(function (n, i) {
      var p = P[i] || [100 + i * 60, 150];
      s += '<circle class="pulse" cx="' + p[0] + '" cy="' + p[1] + '" r="8" style="animation-delay:' + i * .4 + 's"/><circle class="uae" cx="' + p[0] + '" cy="' + p[1] + '" r="5.5"/><text class="lb" x="' + (p[0] + 12) + '" y="' + (p[1] + 4) + '">' + esc(n) + '</text>';
    });
    return s + '<text class="rg" x="30" y="282">READY CANDIDATES · INSIDE THE UAE</text></svg>';
  }

  function visual(x) {
    var v = x.visual;
    if (v === 'world' || v === 'network') return '<div class="vis-card map-card">' + mapHead('Global talent pipeline', '18 source countries') + worldMap(false) + '</div>';
    if (v === 'uae') return '<div class="vis-card map-card">' + mapHead('Local hiring network', '7 Emirates') + uaeMap() + '</div>';
    if (v === 'travel') return boardingPass();
    if (v === 'hr') return '<div class="vis-card mock"><div class="mk-h"><b>Team overview</b><span class="chip ok">Payroll ready</span></div>' + [['AK', 'Site Supervisor', 'Joined'], ['MS', 'Electrician', 'Visa issued'], ['RN', 'Driver', 'Screening'], ['JO', 'Cleaner', 'Joined']].map(function (r, i) { return '<div class="mk-row"><i class="av a' + i + '">' + r[0] + '</i><span><b>' + r[1] + '</b><small>Staff record · Contract on file</small></span><em class="chip ' + (r[2] === 'Joined' ? 'ok' : r[2] === 'Screening' ? 'wait' : 'info') + '">' + r[2] + '</em></div>'; }).join('') + '</div>';
    if (v === 'setup') return '<div class="vis-card mock"><div class="mk-h"><b>Company formation</b><span class="chip info">In progress</span></div>' + ['Trade name & activity', 'Legal structure', 'Trade licence', 'Owner & staff visas', 'Bank account'].map(function (t, i) { return '<div class="mk-step ' + (i < 3 ? 'done' : i === 3 ? 'now' : '') + '"><i>' + (i < 3 ? I('check') : i + 1) + '</i><span>' + t + '</span></div>'; }).join('') + '<div class="mk-bar"><span style="width:64%"></span></div></div>';
    if (v === 'web') return '<div class="vis-card browser"><div class="br-top"><i></i><i></i><i></i><span>yourcompany.ae</span></div><div class="br-body"><div class="br-hero"><b></b><b></b><em></em></div><div class="br-cols"><span></span><span></span><span></span></div></div></div>';
    if (v === 'chart') return '<div class="vis-card mock"><div class="mk-h"><b>Organic enquiries</b><span class="chip ok">' + I('trending', 'ic-xs') + ' Growing</span></div><div class="bars">' + [32, 44, 40, 58, 66, 82].map(function (h, i) { return '<span style="--h:' + h + '%;--d:' + i * .08 + 's"></span>'; }).join('') + '</div><div class="bars-x"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span></div></div>';
    if (v === 'manage') return '<div class="vis-card tiles">' + [['globe', 'Website', 'Online'], ['shield', 'Security', 'Protected'], ['layers', 'Backups', 'Up to date'], ['chat', 'Social posts', 'Scheduled']].map(function (t) { return '<div><i>' + I(t[0]) + '</i><b>' + t[1] + '</b><small><em></em>' + t[2] + '</small></div>'; }).join('') + '</div>';
    if (v === 'shop') return '<div class="vis-card mock"><div class="mk-h"><b>Your online store</b><span class="chip ok">' + I('card', 'ic-xs') + ' Payments on</span></div><div class="prods"><span></span><span></span><span></span></div><div class="mk-row"><i class="av a1">' + I('truck', 'ic-xs') + '</i><span><b>New order received</b><small>Paid · Ready to ship</small></span><em class="chip info">Order</em></div></div>';
    return '<div class="vis-card big-ic"><i>' + I(x.icon) + '</i></div>';
  }
  function mapHead(t, chip) { return '<div class="mk-h"><b><span class="live"></span>' + t + '</b><span class="chip info">' + chip + '</span></div>'; }
  function boardingPass() {
    return '<div class="pass"><div class="pass-main"><div class="pass-top"><span>' + I('plane', 'ic-sm') + ' Boarding pass</span><em>Visit visa</em></div><div class="pass-route"><div><small>From</small><b>DXB</b><span>Dubai</span></div><div class="pass-line"><i></i>' + I('plane') + '</div><div><small>To</small><b>Anywhere</b><span>Saudi · Europe · USA · Asia</span></div></div><div class="pass-meta"><div><small>Visa</small><b>Arranged</b></div><div><small>Tickets</small><b>Booked</b></div><div><small>Hotel</small><b>Reserved</b></div></div></div><div class="pass-stub"><div class="barcode"></div><small>RH TRAVEL</small></div></div>';
  }

  function destRow(list, rev) {
    var h = list.map(function (c) { return '<span class="dest">' + window.flag(c[0]) + esc(c[1]) + '</span>'; }).join('');
    return '<div class="marquee' + (rev ? ' rev' : '') + '"><div class="mq-track">' + h + h + '</div></div>';
  }

  /* ---------- reusable blocks ---------- */
  function svcCard(x, withTags) {
    return '<a class="card svc-card reveal" href="' + svcUrl(x) + '"><i class="tile">' + I(x.icon) + '</i><h3>' + esc(x.name) + '</h3><p>' + esc(x.summary) + '</p>' + (withTags && x.tags ? '<div class="tags">' + x.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' : '') + '<span class="more">Learn more ' + arrow() + '</span></a>';
  }
  function audience() {
    return '<section class="section pt-0"><div class="wrap aud">' +
      '<a class="aud-card dark reveal" href="hire-staff.html"><span class="eyebrow light">For companies</span><h3>Need workers? We supply them.</h3><p>Tell us the roles and numbers. We supply skilled and unskilled manpower from inside and outside the UAE.</p><span class="btn btn-gold">Hire Manpower' + arrow() + '</span><i class="aud-ic">' + I('users') + '</i></a>' +
      '<a class="aud-card light reveal" href="partner-with-us.html"><span class="eyebrow">For recruitment agents</span><h3>Have candidates? Partner with us.</h3><p>Agents and agencies with ready candidates — we place them with companies in the UAE.</p><span class="btn btn-primary">Become a Partner' + arrow() + '</span><i class="aud-ic">' + I('link') + '</i></a></div></section>';
  }
  function steps(list, dark) {
    return '<div class="steps' + (dark ? ' dark' : '') + '">' + list.map(function (s, i) { return '<div class="step reveal"><span class="num">0' + (i + 1) + '</span><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></div>'; }).join('') + '</div>';
  }
  function contactForm() {
    return '<form class="form" data-kind="general" novalidate><div class="row2"><label>Your name<input name="Name" required autocomplete="name"></label><label>Email address<input name="Email" type="email" required autocomplete="email"></label></div><div class="row2"><label>Phone (optional)<input name="Phone" type="tel" autocomplete="tel"></label><label>Service<select name="Service">' + S.services.map(function (x) { return '<option>' + esc(x.name) + '</option>'; }).join('') + '<option>Other</option></select></label></div><label>Message<textarea name="Message" rows="4" placeholder="Tell us what you need"></textarea></label><button class="btn btn-primary btn-lg" type="submit">Send Message' + I('send', 'ic-sm') + '</button><p class="form-note">Your message opens in your email app, addressed to ' + esc(C.email) + '.</p></form>';
  }
  function contactBlock() {
    return '<section class="section soft" id="contact"><div class="wrap contact-grid"><div class="reveal">' + head('Make an appointment', 'We’re ready to help you', 'Tell us what you need and our team will get back to you with the next steps.') +
      '<div class="ct-list">' + ctItem('phone', 'Call us', C.phone, tel()) + ctItem('mail', 'Email us', C.email, 'mailto:' + C.email) + ctItem('pin', 'Visit our office', C.address) + '</div></div><div class="card form-card reveal">' + contactForm() + '</div></div></section>';
  }
  function ctItem(ic, label, val, href) { var t = '<i class="tile sm">' + I(ic) + '</i><span><small>' + label + '</small><b>' + esc(val) + '</b></span>'; return href ? '<a class="ct" href="' + href + '">' + t + '</a>' : '<div class="ct">' + t + '</div>'; }

  /* ---------- pages ---------- */
  function home() {
    var H = S.hero, w0 = H.words[0];
    return '<section class="hero"><div class="hero-bg"></div><div class="wrap hero-in"><div class="hero-copy">' +
      '<span class="pill">' + I('award', 'ic-xs') + esc(H.eyebrow) + '</span>' +
      '<h1>' + esc(H.lead) + '<span class="rot" aria-live="polite"><i class="rot-ic" id="rotIc">' + I(w0.icon) + '</i><span id="rotW">' + esc(w0.text) + '</span></span></h1>' +
      '<p class="lead">' + esc(C.intro) + '</p>' +
      '<div class="acts">' + btn('hire-staff.html', 'Hire Staff', 'btn-gold btn-lg') + btn('partner-with-us.html', 'Partner With Us', 'btn-outline-light btn-lg', false) + '</div>' +
      '<ul class="hero-pts">' + H.points.map(function (p) { return '<li>' + I('check', 'ic-xs') + esc(p) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="hero-vis"><div class="vis-card map-card glass">' + mapHead('Global talent pipeline', 'Live routes') + worldMap(true) + '<div class="map-foot"><span>' + I('globe', 'ic-xs') + ' Africa & Asia → UAE</span><span>' + I('passport', 'ic-xs') + ' Visa & travel handled</span></div></div>' +
      '<div class="float-card fc1"><i>' + I('users') + '</i><span><b>Bulk hiring</b><small>Skilled & unskilled</small></span></div>' +
      '<div class="float-card fc2"><i>' + I('shield') + '</i><span><b>Compliant</b><small>Visa & documents</small></span></div></div></div></section>' +

      '<section class="stats-wrap"><div class="wrap"><div class="stats reveal">' + S.stats.map(function (s) { return '<div><b>' + esc(s.value) + '</b><span>' + esc(s.label) + '</span></div>'; }).join('') + '</div></div></section>' +

      audience() +

      '<section class="section" id="services"><div class="wrap">' + head('Our main service', 'Recruitment & HR Solutions', 'Hiring is the heart of our company. We supply skilled and unskilled workers to companies, one by one or in bulk, from inside and outside the UAE.', true) +
      '<div class="grid g3">' + ['inside-recruitment', 'outside-recruitment', 'hr-solution'].map(function (id) { return svcCard(svc(id), true); }).join('') + '</div>' +
      '<div class="offer reveal"><div class="offer-h"><h3>Everything we offer for hiring</h3><a href="service.html?id=recruitment" class="link">Recruitment services ' + arrow() + '</a></div><div class="offer-grid">' + S.recruitmentItems.map(function (r) { return '<div class="oi"><i>' + I(r.icon) + '</i><span><b>' + esc(r.title) + '</b><small>' + esc(r.text) + '</small></span></div>'; }).join('') + '</div></div></div></section>' +

      '<section class="section dark"><div class="wrap">' + head('How hiring works', 'From requirement to first working day', 'A clear, managed process — you stay informed at every step.', true).replace('sec-head', 'sec-head on-dark') + steps(S.hiringSteps, true) + '</div></section>' +

      '<section class="section" id="about"><div class="wrap split"><div class="reveal"><span class="eyebrow">About our company</span><h2>' + esc(C.name) + '</h2><p class="lead-d">We are a recruitment and HR solutions company based in Dubai. We supply skilled and unskilled workers to companies in bulk, from inside and outside the UAE — and help with company setup, development and marketing.</p>' + ticks(['One partner for hiring, visas, travel and setup', 'Candidates from 18+ countries across Africa & Asia', 'Office in Al Nahda 1, Dubai']) + btn('about.html', 'More about us', 'btn-primary') + '</div>' +
      '<div class="about-vis reveal"><div class="av-main"><span class="q">“</span><p>Our aim is to give every client modern, optimised services and a partner they can trust.</p><div class="av-by"><span class="mark">' + logoMark() + '</span><span><b>' + esc(C.short) + '</b><small>' + esc(C.city) + '</small></span></div></div><div class="av-mini">' + [['target', 'Focused', 'on results'], ['clock', 'Fast', 'placement'], ['heart', 'Trusted', 'partner']].map(function (a) { return '<div><i>' + I(a[0]) + '</i><b>' + a[1] + '</b><small>' + a[2] + '</small></div>'; }).join('') + '</div></div></div></section>' +

      '<section class="section soft" id="travel"><div class="wrap split"><div class="reveal">' + boardingPass() + '</div><div class="reveal"><span class="eyebrow">Travel & Tour</span><h2>Visit visas and flight tickets</h2><p class="lead-d">We also run a travel and tour service. We arrange visit visas for many countries and book your tickets, so your journey is simple from start to finish.</p>' + ticks(['Visit visa for Saudi Arabia', 'Visit visa for European countries', 'Visit visa for the USA', 'Visit visa for Asian countries', 'Flight ticket booking', 'Hotel booking'], 'two') + btn('service.html?id=travel-tour', 'Explore Travel & Tour', 'btn-primary') + '</div></div>' +
      '<div class="dests reveal"><p class="dests-h">Popular destinations</p>' + destRow(S.destinations.asia) + destRow(S.destinations.world, true) + '</div></section>' +

      '<section class="section"><div class="wrap">' + head('More services', 'Other services we offer', 'Beyond recruitment, we help you start, run and grow your business in the UAE.', true) + '<div class="grid g3">' + ['business-setup', 'travel-tour', 'web-development', 'seo-digital-marketing', 'management', 'e-commerce'].map(function (id) { return svcCard(svc(id)); }).join('') + '</div></div></section>' +

      '<section class="section soft"><div class="wrap split"><div class="reveal"><span class="eyebrow">Company formation</span><h2>Want to start a business in the UAE?</h2><p class="lead-d">The UAE offers a strategic location, world-class infrastructure and attractive tax benefits. We guide you through every step — from the company licence and visa processing to compliance and a strong online presence.</p><a class="callout" href="' + tel() + '"><i class="tile sm">' + I('phone') + '</i><span><small>Support center</small><b>' + esc(C.phone) + '</b></span></a>' + btn('service.html?id=business-setup', 'Business setup details', 'btn-primary') + '</div><div class="reveal">' + visual(svc('business-setup')) + '</div></div>' +
      '<div class="wrap" style="margin-top:56px">' + head('Work process', 'We follow a clear process', '', true) + steps(S.process) + '</div></section>' +

      '<section class="section"><div class="wrap split rev"><div class="reveal"><span class="eyebrow">IT solutions</span><h2>Grow with us</h2><p class="lead-d">Strong web development and design give your venture a confident online presence. Digital marketing brings customers, e-commerce turns visits into sales, and HR solutions help you manage your team.</p>' + ticks(['All-in-one IT solution company', 'Expert and friendly teams', 'Quality services for your business', 'Reliable HR solutions']) + btn('contact.html', 'Contact now', 'btn-primary') + '</div><div class="reveal">' + visual(svc('seo-digital-marketing')) + '</div></div></section>' +

      contactBlock();
  }

  function about() {
    return pageHero('About us', C.name, 'A recruitment and HR solutions company based in Dubai, with business setup, travel, development and marketing services alongside.', [['About Us']]) +
      '<section class="section"><div class="wrap split"><div class="reveal"><span class="eyebrow">Who we are</span><h2>We turn ideas into successful businesses</h2><p class="lead-d">We are a recruitment and HR solutions company based in Dubai. We supply skilled and unskilled workers to companies — one by one or in bulk — from inside the UAE and from African and Asian countries.</p><p class="lead-d">Alongside hiring, we help clients set up companies, arrange visit visas and travel, and grow online through development, e-commerce and marketing. Our aim is to give every client modern, optimised services and a partner they can trust.</p>' + btn('contact.html', 'Talk to our team', 'btn-primary') + '</div><div class="reveal"><div class="vis-card map-card">' + mapHead('Where our candidates come from', '18+ countries') + worldMap(false) + '</div></div></div></section>' +
      '<section class="section soft"><div class="wrap">' + head('What we stand for', 'Values behind every placement', '', true) + '<div class="grid g4">' + [['target', 'Right fit', 'We match roles to real skills, not just CVs.'], ['clock', 'Speed', 'Fast shortlisting and quick placement.'], ['shield', 'Compliance', 'Visas, permits and documents done properly.'], ['heart', 'Partnership', 'One trusted team for all your business needs.']].map(function (v) { return '<div class="card value reveal"><i class="tile">' + I(v[0]) + '</i><h3>' + v[1] + '</h3><p>' + v[2] + '</p></div>'; }).join('') + '</div></div></section>' +
      '<section class="section"><div class="wrap">' + head('What we offer', 'Everything your business needs', '', true) + '<div class="grid g3">' + S.services.map(function (x) { return svcCard(x); }).join('') + '</div></div></section>';
  }

  function services() {
    return pageHero('Our services', 'Services built around your business', 'Recruitment and HR at the core — with business setup, travel and digital services to support every stage of your growth.', [['Services']]) +
      '<section class="section"><div class="wrap">' + head('Recruitment & HR', 'Manpower for UAE companies', 'Skilled and unskilled workers, inside the UAE and from overseas, with visa and joining support.') + '<div class="grid g4">' + group('recruitment').map(function (x) { return svcCard(x, true); }).join('') + '</div></div></section>' +
      '<section class="section soft"><div class="wrap">' + head('Business & digital', 'Start, run and grow', 'Company formation, visit visas, websites, online stores and marketing.') + '<div class="grid g3">' + group('business').map(function (x) { return svcCard(x); }).join('') + '</div></div></section>' +
      '<section class="section"><div class="wrap">' + head('Work process', 'How we work with you', '', true) + steps(S.hiringSteps) + '</div></section>';
  }

  function service() {
    var id = new URLSearchParams(location.search).get('id'), x = svc(id) || S.services[0];
    document.title = x.name + ' | ' + C.short;
    var others = S.services.filter(function (y) { return y !== x; });
    var wide = x.visual === 'world' || x.visual === 'uae' || x.visual === 'network';
    return '<section class="page-hero svc-hero"><div class="wrap ph-split' + (wide ? ' wide' : '') + '"><div>' + crumbs([['Services', 'services.html'], [x.short]]) + '<span class="eyebrow light">' + I(x.icon, 'ic-xs') + (x.group === 'recruitment' ? 'Recruitment & HR' : 'Business & digital') + '</span><h1>' + esc(x.name) + '</h1><p class="lead">' + esc(x.text) + '</p><div class="acts">' + btn(x.group === 'recruitment' ? 'hire-staff.html' : 'contact.html', x.group === 'recruitment' ? 'Hire Staff' : 'Get a Quote', 'btn-gold btn-lg') + '<a class="btn btn-outline-light btn-lg" href="' + tel() + '">' + I('phone', 'ic-sm') + esc(C.phone) + '</a></div></div><div class="ph-vis">' + visual(x) + '</div></div></section>' +
      (x.id === 'travel-tour' ? '<section class="section pb-0"><div class="dests"><p class="dests-h">Popular destinations</p>' + destRow(S.destinations.asia) + destRow(S.destinations.world, true) + '</div></section>' : '') +
      (x.id === 'outside-recruitment' ? '<section class="section pb-0"><div class="wrap">' + head('Sourcing countries', 'Where we recruit from', '', true) + '<div class="countries reveal"><div><h4>African countries</h4>' + S.sourcing.africa.map(cty).join('') + '</div><div><h4>Asian countries</h4>' + S.sourcing.asia.map(cty).join('') + '</div></div></div></section>' : '') +
      '<section class="section"><div class="wrap svc-body"><div><span class="eyebrow">What we do</span><h2>What you get with ' + esc(x.short) + '</h2><div class="feat">' + x.points.map(function (p, i) { return '<div class="feat-i reveal"><span class="num">0' + (i + 1) + '</span><b>' + esc(p) + '</b></div>'; }).join('') + '</div>' +
      (x.group === 'recruitment' ? '<h3 class="sub-h">How it works</h3>' + steps(S.hiringSteps) : '') + '</div>' +
      '<aside class="svc-side"><div class="card side-card"><h4>All services</h4>' + S.services.map(function (y) { return '<a class="' + (y === x ? 'on' : '') + '" href="' + svcUrl(y) + '">' + I(y.icon, 'ic-sm') + esc(y.short) + '</a>'; }).join('') + '</div><div class="card side-cta"><i class="tile">' + I('chat') + '</i><h4>Ready to start?</h4><p>Call us or send a message and we will plan the next step with you.</p><a class="btn btn-gold" href="' + tel() + '">' + I('phone', 'ic-sm') + 'Call now</a><a class="btn btn-outline-light" href="contact.html">Send a message</a></div></aside></div></section>' +
      '<section class="section soft"><div class="wrap">' + head('Explore more', 'Related services', '', true) + '<div class="grid g3">' + others.filter(function (y) { return y.group === x.group; }).concat(others.filter(function (y) { return y.group !== x.group; })).slice(0, 3).map(function (y) { return svcCard(y); }).join('') + '</div></div></section>';
    function cty(c) { return '<span class="dest">' + window.flag(c[0]) + esc(c[1]) + '</span>'; }
  }

  function portfolio() {
    var cats = ['All'].concat(S.projects.map(function (p) { return p.category; }).filter(function (c, i, a) { return a.indexOf(c) === i; }));
    return pageHero('Portfolio', 'Our work and projects', 'A look at the kind of work we deliver for our clients across hiring, setup and digital.', [['Portfolio']]) +
      '<section class="section"><div class="wrap"><div class="filters" role="tablist">' + cats.map(function (c, i) { return '<button class="' + (i ? '' : 'on') + '" data-f="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div><div class="grid g3" id="pgrid">' + S.projects.map(function (p, i) {
        return '<article class="card proj reveal" data-c="' + esc(p.category) + '"><div class="proj-art a' + (i % 6) + '"><i>' + I(p.icon) + '</i></div><div class="proj-b"><span class="cat">' + esc(p.category) + '</span><h3>' + esc(p.title) + '</h3><p>' + esc(p.text) + '</p></div></article>';
      }).join('') + '</div></div></section>' +
      '<section class="section soft"><div class="wrap center-cta reveal"><h2>Have a project in mind?</h2><p class="lead-d">Tell us what you need and we will plan it with you.</p>' + btn('contact.html', 'Start a project', 'btn-primary btn-lg') + '</div></section>';
  }

  function contact() {
    return pageHero('Contact us', 'Let’s talk about your business', 'Hiring, a visit visa, a new company or a website — our team is one message away.', [['Contact Us']]) +
      '<section class="section"><div class="wrap"><div class="grid g3 ct-cards">' + [['phone', 'Phone', C.phone, tel()], ['mail', 'Email', C.email, 'mailto:' + C.email], ['pin', 'Office', C.address, '']].map(function (a) { return '<' + (a[3] ? 'a href="' + a[3] + '"' : 'div') + ' class="card ct-card reveal"><i class="tile">' + I(a[0]) + '</i><small>' + a[1] + '</small><b>' + esc(a[2]) + '</b></' + (a[3] ? 'a' : 'div') + '>'; }).join('') + '</div>' +
      '<div class="contact-grid mt"><div class="card form-card reveal"><h3>Send us a message</h3>' + contactForm() + '</div><div class="map-embed reveal"><iframe title="Office location" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' + encodeURIComponent('Mai Tower, Al Nahda 1, Dubai') + '&output=embed"></iframe></div></div></div></section>';
  }

  function lead(kind) {
    var co = kind === 'company';
    var f = co
      ? '<form class="form" data-kind="company" novalidate><div class="row2">' + inp('Company name', 1) + inp('Contact person', 1) + '</div><div class="row2">' + inp('Email', 1, 'email') + inp('Phone', 1, 'tel') + '</div>' + inp('Roles or job titles needed', 1) + '<div class="row2">' + inp('Number of workers') + '<label>Hiring from<select name="Hiring from"><option>Inside the UAE</option><option>Outside the UAE</option><option>Both inside and outside</option></select></label></div><label>Anything else we should know<textarea name="Message" rows="4"></textarea></label><button class="btn btn-primary btn-lg" type="submit">Send Hiring Request' + I('send', 'ic-sm') + '</button></form>'
      : '<form class="form" data-kind="agent" novalidate><div class="row2">' + inp('Agency or company name', 1) + inp('Country', 1) + '</div><div class="row2">' + inp('Contact person', 1) + inp('Email', 1, 'email') + '</div><div class="row2">' + inp('Phone', 1, 'tel') + '<label>Candidates<select name="Candidates"><option>Skilled workers</option><option>Unskilled workers</option><option>Both skilled and unskilled</option></select></label></div>' + inp('Number of candidates you can supply') + '<label>Tell us about your agency<textarea name="Message" rows="4"></textarea></label><button class="btn btn-primary btn-lg" type="submit">Send Partnership Request' + I('send', 'ic-sm') + '</button></form>';
    var pts = co ? ['Skilled and unskilled workers', 'Hiring from inside and outside the UAE', 'Bulk hiring for companies', 'Visa and joining support'] : ['Placement with companies in the UAE', 'Candidates from African and Asian countries', 'Simple partnership process', 'Quick response from our team'];
    return pageHero(co ? 'For companies' : 'For recruitment agents', co ? 'Hire manpower for your company' : 'Become a recruitment partner', co ? 'Tell us the roles you need and how many workers. We will find skilled and unskilled candidates from inside and outside the UAE.' : 'Are you an agent or agency with candidates? Partner with us and we will place them with companies in the UAE.', [[co ? 'Hire Staff' : 'Partner With Us']]) +
      '<section class="section"><div class="wrap lead-grid"><div class="reveal"><span class="eyebrow">' + (co ? 'Why companies choose us' : 'Why partner with us') + '</span><h2>' + (co ? 'One request. A complete hiring service.' : 'Your candidates. Our UAE network.') + '</h2>' + ticks(pts) + '<div class="lead-steps">' + (co ? S.hiringSteps : [{ title: 'Send your details', text: 'Share your agency profile and candidate pool.' }, { title: 'We review', text: 'Our team checks fit with current company demand.' }, { title: 'Start placing', text: 'We place your candidates with UAE companies.' }]).map(function (s, i) { return '<div><span>' + (i + 1) + '</span><b>' + esc(s.title) + '</b><small>' + esc(s.text) + '</small></div>'; }).join('') + '</div><a class="callout" href="' + tel() + '"><i class="tile sm">' + I('phone') + '</i><span><small>Prefer to talk?</small><b>' + esc(C.phone) + '</b></span></a></div>' +
      '<div class="card form-card reveal"><h3>' + (co ? 'Hiring request' : 'Partnership request') + '</h3><p class="form-sub">Fields marked * are required.</p>' + f + '</div></div></section>';
    function inp(n, req, type) { return '<label>' + n + (req ? ' *' : '') + '<input name="' + n + '"' + (req ? ' required' : '') + ' type="' + (type || 'text') + '"></label>'; }
  }

  /* ---------- mount ---------- */
  var R = { home: home, about: about, services: services, service: service, portfolio: portfolio, contact: contact, hire: function () { return lead('company'); }, partner: function () { return lead('agent'); } };
  document.getElementById('header').innerHTML = header();
  document.getElementById('main').innerHTML = (R[page] || home)();
  document.getElementById('footer').innerHTML = footer();

  /* ---------- behaviour ---------- */
  var hdr = document.getElementById('hdr'), nav = document.getElementById('nav'), bur = document.getElementById('burger');
  function onScroll() { hdr.classList.toggle('scrolled', window.scrollY > 10); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  function setMenu(open) { nav.classList.toggle('open', open); document.body.classList.toggle('menu-open', open); bur.setAttribute('aria-expanded', open); bur.innerHTML = I(open ? 'close' : 'menu'); }
  bur.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  nav.querySelectorAll('.has-dd > a').forEach(function (a) { a.addEventListener('click', function (e) { if (window.innerWidth < 1080) { e.preventDefault(); a.parentNode.classList.toggle('open'); } }); });
  document.getElementById('totop').addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  // reveal on scroll
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
  } else els.forEach(function (el) { el.classList.add('in'); });

  // pause SVG animations for reduced motion
  if (reduce) document.querySelectorAll('svg.map').forEach(function (s) { s.pauseAnimations && s.pauseAnimations(); });

  // rotating hero word
  var rw = document.getElementById('rotW'), ri = document.getElementById('rotIc');
  if (rw && !reduce) {
    var k = 0;
    setInterval(function () {
      rw.parentNode.classList.add('out');
      setTimeout(function () { k = (k + 1) % S.hero.words.length; var w = S.hero.words[k]; rw.textContent = w.text; ri.innerHTML = I(w.icon); rw.parentNode.classList.remove('out'); }, 350);
    }, 2800);
  }

  // portfolio filter
  document.querySelectorAll('.filters button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.filters button').forEach(function (o) { o.classList.toggle('on', o === b); });
      var f = b.getAttribute('data-f');
      document.querySelectorAll('#pgrid .proj').forEach(function (p) { p.hidden = !(f === 'All' || p.getAttribute('data-c') === f); });
    });
  });

  // forms → email
  document.querySelectorAll('form.form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      f.querySelectorAll('[required]').forEach(function (el) { var ok = el.value.trim() && (el.type !== 'email' || /\S+@\S+\.\S+/.test(el.value)); el.classList.toggle('err', !ok); if (!ok && !bad) bad = el; });
      if (bad) { bad.focus(); toast('Please fill in the required fields.', true); return; }
      var lines = [], kind = f.getAttribute('data-kind');
      Array.prototype.forEach.call(f.elements, function (el) { if (el.name && el.value) lines.push(el.name + ': ' + el.value); });
      var subj = kind === 'company' ? 'Manpower request from a company' : kind === 'agent' ? 'Recruitment partner enquiry' : 'Enquiry: ' + (f.elements.Service ? f.elements.Service.value : 'General');
      location.href = 'mailto:' + C.email + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(lines.join('\n'));
      toast('Opening your email app… Thank you!');
    });
  });
  function toast(msg, err) {
    var t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.setAttribute('role', 'status'); t.innerHTML = I(err ? 'close' : 'check') + '<span>' + esc(msg) + '</span>';
    document.body.appendChild(t); requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 3200);
  }
})();
