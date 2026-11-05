/* RH Business Solutions — front end
 * Renders the shared header/footer and each page from window.SITE (content.js).
 */
(function () {
  'use strict';
  var S = window.SITE, C = S.company, I = window.icon;
  document.documentElement.classList.add('js');
  var page = document.body.getAttribute('data-page') || 'home';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function hl(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<mark>$1</mark>'); }
  function plain(s) { return String(s == null ? '' : s).replace(/\*\*/g, ''); }
  function svc(id) { return S.services.filter(function (x) { return x.id === id; })[0]; }
  function svcUrl(x) { return 'service-' + x.id + '.html'; }
  function mapQ() { return C.map || C.address; } // Google Maps search text from the admin
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
    function ddItem(x) { return '<a href="' + svcUrl(x) + '"><i>' + I(x.icon) + '</i><span><b>' + esc(x.short) + '</b><small>' + esc(plain(x.summary)) + '</small></span></a>'; }
    var links = S.nav.map(function (n) {
      var on = n.page === page || (page === 'service' && n.page === 'services');
      if (n.dropdown) return '<div class="has-dd"><a href="' + n.href + '" class="' + (on ? 'on' : '') + '">' + esc(n.label) + I('chevron', 'ic-xs') + '</a>' + drop + '</div>';
      return '<a href="' + n.href + '" class="' + (on ? 'on' : '') + '">' + esc(n.label) + '</a>';
    }).join('');
    return '<div class="topbar"><div class="wrap"><div class="tb-l"><a href="' + tel() + '">' + I('phone', 'ic-xs') + esc(C.phone) + '</a><a href="mailto:' + esc(C.email) + '">' + I('mail', 'ic-xs') + esc(C.email) + '</a></div><div class="tb-r">' + I('pin', 'ic-xs') + '<span>' + esc(C.addressShort || C.city) + '</span></div></div></div>' +
      '<header class="site-header" id="hdr"><div class="wrap hdr-in"><a class="brand" href="index.html" aria-label="' + esc(C.short) + ' home"><span class="mark">' + logoMark() + '</span><span class="brand-t"><b>' + esc(C.short) + '</b><small>' + esc(C.sub) + '</small></span></a>' +
      '<nav class="main-nav" id="nav" aria-label="Main">' + links + '<div class="nav-cta-m">' + btn('partner-with-us.html', 'Partner With Us', 'btn-ghost', false) + btn('hire-staff.html', 'Hire Staff', 'btn-primary') + '</div></nav>' +
      '<div class="hdr-cta">' + btn('partner-with-us.html', 'Partner With Us', 'btn-ghost', false) + btn('hire-staff.html', 'Hire Staff', 'btn-primary') + '</div>' +
      '<button class="burger" id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="nav">' + I('menu') + '</button></div></header>';
  }

  /* ---------- footer ---------- */
  function footer() {
    return '<footer class="site-footer"><div class="wrap">' +
      '<div class="f-cta reveal"><div><span class="eyebrow light">Get started</span><h3>Ready to hire or plan a trip?</h3><p>Talk to our team today — we reply quickly.</p></div><div class="f-cta-b">' + btn('hire-staff.html', 'Hire Staff', 'btn-gold') + btn('partner-with-us.html', 'Partner With Us', 'btn-outline-light', false) + '</div></div>' +
      '<div class="f-grid"><div class="f-brand"><a class="brand light f-logo" href="index.html"><span class="mark mark-lg">' + logoMark() + '</span><span class="brand-t"><b>' + esc(C.short) + '</b><small>' + esc(C.sub) + '</small></span></a><p>' + esc(C.footer) + '</p>' +
        '<div class="f-quick"><a href="' + tel() + '" aria-label="Call us">' + I('phone') + '</a><a href="mailto:' + esc(C.email) + '" aria-label="Email us">' + I('mail') + '</a><a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapQ()) + '" target="_blank" rel="noopener" aria-label="Find us on the map">' + I('pin') + '</a></div>' +
        '<div class="f-tags"><span>' + I('users', 'ic-xs') + 'Recruitment</span><span>' + I('briefcase', 'ic-xs') + 'HR Solutions</span><span>' + I('plane', 'ic-xs') + 'Travel & Tour</span><span>' + I('building', 'ic-xs') + 'Business Setup</span></div></div>' +
      '<div class="f-col"><h5>Company</h5>' + [['index.html', 'Home', 'dashboard'], ['about.html', 'About Us', 'building'], ['portfolio.html', 'Portfolio', 'award'], ['hire-staff.html', 'Hire Staff', 'users'], ['partner-with-us.html', 'Partner With Us', 'link'], ['contact.html', 'Contact Us', 'phone']].map(function (l) { return '<a class="f-link" href="' + l[0] + '"><i>' + I(l[2]) + '</i>' + l[1] + '</a>'; }).join('') + '</div>' +
      '<div class="f-col f-svc"><h5>Services</h5><div class="f-svc-grid">' + S.services.map(function (x) { return '<a class="f-link" href="' + svcUrl(x) + '"><i>' + I(x.icon) + '</i>' + esc(x.short) + '</a>'; }).join('') + '</div></div>' +
      '<div class="f-col"><h5>Get in touch</h5><a class="f-ct" href="' + tel() + '"><i>' + I('phone') + '</i><span><small>Call us</small>' + esc(C.phone) + '</span></a><a class="f-ct" href="mailto:' + esc(C.email) + '"><i>' + I('mail') + '</i><span><small>Email</small>' + esc(C.email) + '</span></a><div class="f-ct"><i>' + I('pin') + '</i><span><small>Office</small>' + esc(C.address) + '</span></div></div></div>' +
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
    if (v === 'world' || v === 'network') return '<div class="vis-card map-card">' + mapHead('Global talent pipeline', '40 source countries') + worldMap(false) + '</div>';
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
    return '<a class="card svc-card reveal" href="' + svcUrl(x) + '"><span class="svc-top"><i class="tile">' + I(x.icon) + '</i><span class="svc-badge">' + (x.group === 'recruitment' ? 'Recruitment & HR' : 'Business & Digital') + '</span></span><h3>' + esc(x.name) + '</h3><p>' + hl(x.summary) + '</p>' +
      (withTags && x.tags ? '<div class="tags">' + x.tags.map(function (t) { return '<span>' + I('check', 'ic-xs') + esc(t) + '</span>'; }).join('') + '</div>' : '') +
      '<span class="svc-foot"><span class="more">Learn more</span><i class="go">' + arrow() + '</i></span><i class="wm" aria-hidden="true">' + I(x.icon) + '</i></a>';
  }
  function offerRows() {
    var L = S.recruitmentItems, h = Math.ceil(L.length / 2);
    function item(r) { return '<div class="oi"><i class="tile sm">' + I(r.icon) + '</i><span><b>' + esc(r.title) + '</b><small>' + hl(r.text) + '</small></span></div>'; }
    function row(list, cls) { var a = list.map(item).join(''); return '<div class="oq ' + cls + '"><div class="oq-track"><div class="oq-set">' + a + '</div><div class="oq-set" aria-hidden="true">' + a + '</div></div></div>'; }
    return '<div class="offer-rows">' + row(L.slice(0, h), 'from-right') + row(L.slice(h), 'from-left') + '</div>';
  }
  function audience() {
    var flags = ['pk', 'in', 'np', 'bd', 'lk', 'ph', 'ng', 'ke', 'gh', 'ug', 'et', 'eg'];
    return '<section class="section aud-sec"><div class="wrap aud">' +
      '<a class="aud-card aud-co reveal" href="hire-staff.html"><div class="aud-head"><i class="tile gold">' + I('users') + '</i><span class="eyebrow light">For companies</span></div>' +
      '<h3>Need workers? We <em class="hl">supply</em> them.</h3><p>Tell us the roles and numbers. We supply <mark>skilled and unskilled manpower</mark> from inside and outside the UAE.</p>' +
      '<div class="aud-vis">' + [['idcard', 'Skilled workers', 'Technical & trade roles', 'ok', 'Ready'], ['hardhat', 'Unskilled workers', 'Labour & support staff', 'ok', 'Ready'], ['users', 'Bulk teams', 'Inside UAE or overseas', 'info', 'On request']].map(function (r) { return '<div class="aud-row"><i>' + I(r[0]) + '</i><span><b>' + r[1] + '</b><small>' + r[2] + '</small></span><em class="chip ' + r[3] + '">' + r[4] + '</em></div>'; }).join('') + '</div>' +
      '<div class="aud-cta"><span class="btn btn-gold">Hire Manpower' + arrow() + '</span><span class="aud-pts">' + I('shield', 'ic-xs') + 'Visa & joining handled</span></div><i class="aud-wm" aria-hidden="true">' + I('users') + '</i></a>' +
      '<a class="aud-card aud-ag reveal" href="partner-with-us.html"><div class="aud-head"><i class="tile">' + I('link') + '</i><span class="eyebrow">For recruitment agents</span></div>' +
      '<h3>Have candidates? <em class="hl blue">Partner</em> with us.</h3><p>Agents and agencies with ready candidates — we place them with <mark>companies in the UAE</mark>.</p>' +
      '<div class="aud-vis"><div class="aud-route"><div class="aud-flags">' + flags.map(function (c) { return window.flag(c); }).join('') + '</div><span class="aud-arrow"><i></i>' + I('plane', 'ic-sm') + '</span><span class="aud-uae">' + window.flag('ae') + '<b>UAE</b></span></div><small class="aud-cap">Candidates from ' + (S.sourcing.africa.length + S.sourcing.asia.length) + ' countries across Africa & Asia</small></div>' +
      '<div class="aud-steps">' + [['send', 'Send details'], ['clipboard', 'We review'], ['briefcase', 'Start placing']].map(function (st, i) { return '<div><i>' + I(st[0]) + '</i><b>' + st[1] + '</b><small>Step ' + (i + 1) + '</small></div>'; }).join('') + '</div>' +
      '<div class="aud-cta"><span class="btn btn-primary">Become a Partner' + arrow() + '</span><span class="aud-pts">' + I('check', 'ic-xs') + 'Simple partnership process</span></div><i class="aud-wm" aria-hidden="true">' + I('link') + '</i></a></div></section>';
  }
  function steps(list, dark) {
    return '<div class="steps' + (dark ? ' dark' : '') + '">' + list.map(function (s, i) { return '<div class="step reveal"><span class="num">0' + (i + 1) + '</span><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></div>'; }).join('') + '</div>';
  }
  function contactForm() {
    return '<form class="form" data-kind="general" novalidate><div class="row2"><label>Your name<input name="Name" required autocomplete="name"></label><label>Email address<input name="Email" type="email" required autocomplete="email"></label></div><div class="row2"><label>Phone (optional)<input name="Phone" type="tel" autocomplete="tel"></label><label>Service<select name="Service">' + S.services.map(function (x) { return '<option>' + esc(x.name) + '</option>'; }).join('') + '<option>Other</option></select></label></div><label>Message<textarea name="Message" rows="4" placeholder="Tell us what you need"></textarea></label><button class="btn btn-primary btn-lg" type="submit">Send Message' + I('send', 'ic-sm') + '</button><p class="form-note">Your message goes straight to our team. You can also email us at ' + esc(C.email) + '.</p></form>';
  }
  function contactBlock() {
    return '<section class="section soft" id="contact"><div class="wrap contact-grid"><div class="reveal">' + head('Make an appointment', 'We’re ready to help you', 'Tell us what you need and our team will get back to you with the next steps.') +
      '<div class="ct-list">' + ctItem('phone', 'Call us', C.phone, tel()) + ctItem('mail', 'Email us', C.email, 'mailto:' + C.email) + ctItem('pin', 'Visit our office', C.address) + '</div></div><div class="card form-card reveal">' + contactForm() + '</div></div></section>';
  }
  function ctItem(ic, label, val, href) { var t = '<i class="tile sm">' + I(ic) + '</i><span><small>' + label + '</small><b>' + esc(val) + '</b></span>'; return href ? '<a class="ct" href="' + href + '">' + t + '</a>' : '<div class="ct">' + t + '</div>'; }

  /* ---------- pages ---------- */
  function home() {
    var H = S.hero, w0 = H.words[0];
    return '<section class="hero" id="hero"><canvas class="hero-map" id="heroMap" aria-hidden="true"></canvas><div class="hero-fade"></div><div class="hero-bg"></div><div class="wrap hero-in"><div class="hero-copy">' +
      '<span class="pill hp-pill">' + I('award', 'ic-xs') + esc(H.eyebrow) + '</span>' +
      '<h1 class="hp-h1">' + esc(H.lead) + '<span class="rot" aria-live="polite"><i class="rot-ic" id="rotIc">' + I(w0.icon) + '</i><span id="rotW">' + esc(w0.text) + '</span></span></h1>' +
      '<p class="lead hp-lead">' + esc(C.intro) + '</p>' +
      '<div class="acts hp-acts">' + btn('hire-staff.html', 'Hire Staff', 'btn-gold btn-lg') + btn('partner-with-us.html', 'Partner With Us', 'btn-outline-light btn-lg', false) + '</div>' +
      '<ul class="hero-pts hp-pts">' + H.points.map(function (p) { return '<li>' + I('check', 'ic-xs') + esc(p) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="hero-vis"><div class="i3d-stage" id="i3dStage" style="--ac:' + (w0.color || '#3d6bff') + '"><div class="i3d-aura"></div><div class="i3d-orbit" id="i3dOrbit">' + ['idcard', 'passport', 'clipboard', 'plane', 'briefcase', 'globe'].map(function (k) { return '<span class="sat">' + I(k) + '</span>'; }).join('') + '</div><div class="i3d-tilt" id="i3dTilt"><div class="i3d">' + [1, 2, 3, 4, 5, 6].map(function (n) { return '<span class="i3d-slice" style="--z:' + (-n * 6) + 'px"></span>'; }).join('') + '<div class="i3d-face"><span class="i3d-shine"></span></div><div class="i3d-icon" id="i3dIc">' + I(w0.icon) + '</div></div></div><div class="i3d-floor"></div><div class="i3d-label"><small>We provide</small><b id="i3dT">' + esc(w0.text) + '</b></div></div>' +
'<div class="float-card fc1"><i>' + I('users') + '</i><span><b>Bulk hiring</b><small>Skilled & unskilled</small></span></div>' +
      '<div class="float-card fc2"><i>' + I('shield') + '</i><span><b>Compliant</b><small>Visa & documents</small></span></div></div></div></section>' +


      audience() +

      '<section class="section" id="services"><div class="wrap">' + head('Our main service', 'Recruitment & HR Solutions', 'Hiring is the heart of our company. We supply skilled and unskilled workers to companies, one by one or in bulk, from inside and outside the UAE.', true) +
      '<div class="grid g3">' + ['inside-recruitment', 'outside-recruitment', 'hr-solution'].map(function (id) { return svcCard(svc(id), true); }).join('') + '</div>' +
      '<div class="offer reveal"><div class="offer-h"><h3>Everything we offer for hiring</h3><a href="service-recruitment.html" class="link">Recruitment services ' + arrow() + '</a></div>' + offerRows() + '</div></div></section>' +

      '<section class="section dark"><div class="wrap">' + head('How hiring works', 'From requirement to first working day', 'A clear, managed process — you stay informed at every step.', true).replace('sec-head', 'sec-head on-dark') + steps(S.hiringSteps, true) + '</div></section>' +

      '<section class="section" id="about"><div class="wrap split"><div class="reveal"><span class="eyebrow">About our company</span><h2>' + esc(C.name) + '</h2><p class="lead-d">We are a recruitment and HR solutions company based in Dubai. We supply skilled and unskilled workers to companies in bulk, from inside and outside the UAE — and help with company setup, development and marketing.</p>' + ticks(['One partner for hiring, visas, travel and setup', 'Candidates from 40 countries across Africa & Asia', 'Office: ' + (C.addressShort || C.city)]) + btn('about.html', 'More about us', 'btn-primary') + '</div>' +
      '<div class="about-vis reveal"><div class="av-main"><span class="q">“</span><p>Our aim is to give every client modern, optimised services and a partner they can trust.</p><div class="av-by"><span class="mark">' + logoMark() + '</span><span><b>' + esc(C.short) + '</b><small>' + esc(C.city) + '</small></span></div></div><div class="av-mini">' + [['target', 'Focused', 'on results'], ['clock', 'Fast', 'placement'], ['heart', 'Trusted', 'partner']].map(function (a) { return '<div><i>' + I(a[0]) + '</i><b>' + a[1] + '</b><small>' + a[2] + '</small></div>'; }).join('') + '</div></div></div></section>' +

      '<section class="section soft" id="travel"><div class="wrap split"><div class="reveal">' + boardingPass() + '</div><div class="reveal"><span class="eyebrow">Travel & Tour</span><h2>Visit visas and flight tickets</h2><p class="lead-d">We also run a travel and tour service. We arrange visit visas for many countries and book your tickets, so your journey is simple from start to finish.</p>' + ticks(['Visit visa for Saudi Arabia', 'Visit visa for European countries', 'Visit visa for the USA', 'Visit visa for Asian countries', 'Flight ticket booking', 'Hotel booking'], 'two') + btn('service-travel-tour.html', 'Explore Travel & Tour', 'btn-primary') + '</div></div>' +
      '<div class="dests reveal"><p class="dests-h">Popular destinations</p>' + destRow(S.destinations.asia) + destRow(S.destinations.world, true) + '</div></section>' +

      '<section class="section"><div class="wrap">' + head('More services', 'Other services we offer', 'Beyond recruitment, we help you start, run and grow your business in the UAE.', true) + '<div class="grid g3">' + ['business-setup', 'travel-tour', 'web-development', 'seo-digital-marketing', 'management', 'e-commerce'].map(function (id) { return svcCard(svc(id)); }).join('') + '</div></div></section>' +


      '<section class="section soft"><div class="wrap split"><div class="reveal"><span class="eyebrow">Company formation</span><h2>Want to start a business in the UAE?</h2><p class="lead-d">The UAE offers a strategic location, world-class infrastructure and attractive tax benefits. We guide you through every step — from the company licence and visa processing to compliance and a strong online presence.</p><a class="callout" href="' + tel() + '"><i class="tile sm">' + I('phone') + '</i><span><small>Support center</small><b>' + esc(C.phone) + '</b></span></a>' + btn('service-business-setup.html', 'Business setup details', 'btn-primary') + '</div><div class="reveal">' + visual(svc('business-setup')) + '</div></div>' +
      '<div class="wrap" style="margin-top:56px">' + head('Work process', 'We follow a clear process', '', true) + steps(S.process) + '</div></section>' +
      '<section class="section"><div class="wrap split rev"><div class="reveal"><span class="eyebrow">IT solutions</span><h2>Grow with us</h2><p class="lead-d">Strong web development and design give your venture a confident online presence. Digital marketing brings customers, e-commerce turns visits into sales, and HR solutions help you manage your team.</p>' + ticks(['All-in-one IT solution company', 'Expert and friendly teams', 'Quality services for your business', 'Reliable HR solutions']) + btn('contact.html', 'Contact now', 'btn-primary') + '</div><div class="reveal">' + visual(svc('seo-digital-marketing')) + '</div></div></section>' +

      contactBlock();
  }

  function about() {
    return pageHero('About us', C.name, 'A recruitment and HR solutions company based in Dubai, with business setup, travel, development and marketing services alongside.', [['About Us']]) +
      '<section class="section"><div class="wrap split"><div class="reveal"><span class="eyebrow">Who we are</span><h2>We turn ideas into successful businesses</h2><p class="lead-d">We are a recruitment and HR solutions company based in Dubai. We supply skilled and unskilled workers to companies — one by one or in bulk — from inside the UAE and from African and Asian countries.</p><p class="lead-d">Alongside hiring, we help clients set up companies, arrange visit visas and travel, and grow online through development, e-commerce and marketing. Our aim is to give every client modern, optimised services and a partner they can trust.</p>' + btn('contact.html', 'Talk to our team', 'btn-primary') + '</div><div class="reveal"><div class="vis-card map-card">' + mapHead('Where our candidates come from', '40 countries') + worldMap(false) + '</div></div></div></section>' +
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
    var id = (SPA && svcId) || document.body.getAttribute('data-id') || new URLSearchParams(location.search).get('id'), x = svc(id) || S.services[0];
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
      '<div class="contact-grid mt"><div class="card form-card reveal"><h3>Send us a message</h3>' + contactForm() + '</div>' + (window.RH_SPA ? '<a class="map-embed map-link reveal" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapQ()) + '" target="_blank" rel="noopener">' + uaeMap() + '<span class="btn btn-primary">' + I('pin', 'ic-sm') + 'Open in Google Maps</span></a>' : '<div class="map-embed reveal"><iframe title="Office location" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' + encodeURIComponent(mapQ()) + '&output=embed"></iframe></div>') + '</div></div></section>';
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
  // Single-file preview mode: pages are routed by #hash instead of separate .html files.
  var SPA = !!window.RH_SPA, FILES = { 'index.html': 'home', 'about.html': 'about', 'services.html': 'services', 'portfolio.html': 'portfolio', 'contact.html': 'contact', 'hire-staff.html': 'hire-staff', 'partner-with-us.html': 'partner-with-us' }, HASH = { 'hire-staff': 'hire', 'partner-with-us': 'partner' };
  var svcId = null;
  function fromHash() {
    var h = (location.hash || '#home').slice(1);
    if (h.indexOf('service-') === 0) { svcId = h.slice(8); return 'service'; }
    return HASH[h] || (R[h] ? h : 'home');
  }
  function toHash(root) {
    if (!SPA) return;
    root.querySelectorAll('a[href]').forEach(function (a) {
      var h = a.getAttribute('href'), m = h.match(/^service-(.+)\.html$/);
      if (m) a.setAttribute('href', '#service-' + decodeURIComponent(m[1]));
      else if (FILES[h]) a.setAttribute('href', '#' + FILES[h]);
    });
  }
  if (SPA) {
    page = fromHash();
  }
  function mount() {
    document.getElementById('header').innerHTML = header();
    document.getElementById('main').innerHTML = (R[page] || home)();
    document.getElementById('footer').innerHTML = footer();
    toHash(document.body);
  }
  mount();
  if (!document.querySelector('.bg-fx')) {
    var fx = document.createElement('div'); fx.className = 'bg-fx'; fx.setAttribute('aria-hidden', 'true');
    fx.innerHTML = '<div class="aurora au1"></div><div class="aurora au2"></div><div class="aurora au3"></div><div class="grid-l"></div><div class="beam"></div><div class="beam b2"></div><canvas id="fxc"></canvas><div class="fx-icons">' + ['users', 'idcard', 'briefcase', 'passport', 'clipboard', 'globe', 'plane', 'cap', 'hardhat', 'file', 'wallet', 'shield', 'users', 'idcard', 'briefcase', 'clipboard'].map(function (k, i) { return '<span style="left:' + ((i * 6.3 + (i % 3) * 7) % 94) + '%;top:' + ((i * 37 + 8) % 90) + '%;--s:' + (34 + (i % 4) * 16) + 'px;--d:' + (16 + (i % 5) * 5) + 's;animation-delay:-' + i * 2.3 + 's">' + I(k) + '</span>'; }).join('') + '</div><div class="vig"></div>';
    document.body.insertBefore(fx, document.body.firstChild);
    network(document.getElementById('fxc'));
  }
  if (SPA) window.addEventListener('hashchange', function () {
    if ((location.hash || '').length > 1 && document.getElementById(location.hash.slice(1)) && !/^#(home|about|services|portfolio|contact|hire-staff|partner-with-us|service-)/.test(location.hash)) return;
    page = fromHash(); mount(); bind(); window.scrollTo(0, 0);
  });

  /* Animated background: slow-drifting talent network with gold "routes" */
  function network(c) {
    var x = c.getContext('2d'), W, H, D = Math.min(window.devicePixelRatio || 1, 2), N = [], mouse = { x: -999, y: -999 }, run = true, t = 0;
    function size() {
      W = window.innerWidth; H = window.innerHeight; c.width = W * D; c.height = H * D; x.setTransform(D, 0, 0, D, 0, 0);
      var n = Math.round(Math.min(60, W * H / 24000)); N = [];
      for (var i = 0; i < n; i++) N.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22, r: Math.random() * 1.4 + .6, g: Math.random() < .12 });
    }
    function frame() {
      x.clearRect(0, 0, W, H); t++;
      for (var i = 0; i < N.length; i++) {
        var p = N[i];
        if (!reduce) { p.x += p.vx; p.y += p.vy; if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20; if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20; }
        var dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        for (var j = i + 1; j < N.length; j++) {
          var q = N[j], d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 150) {
            var a = (1 - d / 150) * .22; if (dm < 180) a *= 1.8;
            x.strokeStyle = (p.g && q.g) ? 'rgba(220,170,72,' + a * 1.6 + ')' : 'rgba(110,145,255,' + a + ')';
            x.lineWidth = 1; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(q.x, q.y); x.stroke();
          }
        }
      }
      for (i = 0; i < N.length; i++) {
        p = N[i]; var tw = .55 + .45 * Math.sin(t * .02 + i);
        x.fillStyle = p.g ? 'rgba(232,189,102,' + (.75 * tw + .2) + ')' : 'rgba(160,185,255,' + (.5 * tw + .2) + ')';
        x.beginPath(); x.arc(p.x, p.y, p.g ? p.r + .8 : p.r, 0, 7); x.fill();
        if (p.g) { x.fillStyle = 'rgba(232,189,102,.08)'; x.beginPath(); x.arc(p.x, p.y, 7, 0, 7); x.fill(); }
      }
      if (run && !reduce) requestAnimationFrame(frame);
    }
    size(); frame();
    window.addEventListener('resize', function () { size(); if (reduce) frame(); });
    window.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    document.addEventListener('visibilitychange', function () { var was = run; run = !document.hidden; if (run && !was && !reduce) requestAnimationFrame(frame); });
  }

  /* ---------- behaviour ---------- */
  var scrollBound = false;
  function bind() {
  var hdr = document.getElementById('hdr'), nav = document.getElementById('nav'), bur = document.getElementById('burger');
  function onScroll() { hdr.classList.toggle('scrolled', window.scrollY > 10); }
  if (!scrollBound) { window.addEventListener('scroll', function () { var h = document.getElementById('hdr'); h && h.classList.toggle('scrolled', window.scrollY > 10); }, { passive: true }); scrollBound = true; } onScroll();
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
  clearInterval(window.__rhRot);
  if (rw && !reduce) {
    var k = 0;
    window.__rhRot = setInterval(function () {
      rw.parentNode.classList.add('out');
      var ic3 = document.getElementById('i3dIc'); if (ic3) ic3.classList.add('out');
      setTimeout(function () { k = (k + 1) % S.hero.words.length; var w = S.hero.words[k]; rw.textContent = w.text; ri.innerHTML = I(w.icon); rw.parentNode.classList.remove('out');
        var st = document.getElementById('i3dStage'), t3 = document.getElementById('i3dT');
        if (st && ic3) { st.style.setProperty('--ac', w.color || '#3d6bff'); ic3.innerHTML = I(w.icon); t3.textContent = w.text; ic3.classList.remove('out'); }
      }, 380);
    }, 3200);
  }

  // portfolio filter
  document.querySelectorAll('.filters button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.filters button').forEach(function (o) { o.classList.toggle('on', o === b); });
      var f = b.getAttribute('data-f');
      document.querySelectorAll('#pgrid .proj').forEach(function (p) { p.hidden = !(f === 'All' || p.getAttribute('data-c') === f); });
    });
  });

  // forms → back end (admin/api.php stores them in the admin leads inbox); email app as fallback
  document.querySelectorAll('form.form').forEach(function (f) {
    var trap = document.createElement('input'); // honeypot: hidden from people, bots fill it in
    trap.name = 'website'; trap.tabIndex = -1; trap.autocomplete = 'off'; trap.setAttribute('aria-hidden', 'true');
    trap.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
    f.appendChild(trap);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      f.querySelectorAll('[required]').forEach(function (el) { var ok = el.value.trim() && (el.type !== 'email' || /\S+@\S+\.\S+/.test(el.value)); el.classList.toggle('err', !ok); if (!ok && !bad) bad = el; });
      if (bad) { bad.focus(); toast('Please fill in the required fields.', true); return; }
      var lines = [], fields = {}, kind = f.getAttribute('data-kind');
      Array.prototype.forEach.call(f.elements, function (el) { if (el.name && el.name !== 'website' && el.value) { lines.push(el.name + ': ' + el.value); fields[el.name] = el.value; } });
      var subj = kind === 'company' ? 'Manpower request from a company' : kind === 'agent' ? 'Recruitment partner enquiry' : 'Enquiry: ' + (f.elements.Service ? f.elements.Service.value : 'General');
      var send = f.querySelector('[type=submit]');
      function viaEmail() {
        location.href = 'mailto:' + C.email + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(lines.join('\n'));
        toast('Opening your email app… Thank you!');
      }
      if (!window.fetch || ((location.protocol === 'file:' || window.RH_SPA) && !window.RH_DEMO)) return viaEmail();
      send.disabled = true;
      fetch('api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: kind, page: location.pathname, fields: fields, website: trap.value }) })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (d) {
            if (r.ok) { f.reset(); toast('Thank you! Your message was sent — we will contact you soon.'); }
            else if (r.status === 400 || r.status === 429) toast(d.error || 'Please check the form and try again.', true);
            else viaEmail();
          });
        })
        .catch(viaEmail)
        .then(function () { send.disabled = false; });
    });
  });
    heroMap(document.getElementById('heroMap'));
    orbit();
    tilt();
  }
  bind();

  /* Hero background: dotted map of Africa, Arabia & Asia with planes flying from every sourcing country to the UAE */
  function getLand() { return [
    [[-17, 21], [-16, 28], [-10, 30], [-6, 36], [3, 37], [10, 37], [11, 33], [15, 32], [20, 31], [25, 32], [32, 31], [34, 28], [37, 22], [39, 15], [43, 12], [51, 12], [49, 7], [44, 2], [40, -3], [40, -11], [36, -18], [35, -24], [32, -29], [27, -34], [19, -35], [17, -29], [12, -17], [13, -6], [9, -1], [9, 4], [4, 6], [-3, 5], [-8, 4], [-13, 8], [-17, 14]],
    [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
    [[35, 28], [39, 22], [43, 13], [45, 13], [52, 16], [56, 18], [59, 22], [56.5, 25], [56, 26.3], [55, 25.5], [52, 24], [50, 26], [48, 29], [47, 30], [44, 32], [39, 32], [35, 32]],
    [[36, 36], [44, 38], [48, 30], [51, 27], [57, 25.5], [62, 25], [67, 24], [70, 21], [73, 17], [77, 8], [80, 13], [80, 16], [87, 21], [90, 22], [92, 21], [94, 17], [97, 16], [98, 9], [100, 6], [104, 1], [103, 9], [105, 9], [109, 12], [108, 17], [106, 21], [110, 21], [117, 24], [121, 30], [122, 37], [121, 40], [125, 40], [126, 45], [36, 45]],
    [[-10, 36], [-9, 43], [-2, 43.5], [3, 43], [8, 44], [12, 44], [16, 41], [18, 40], [16, 38], [13, 41], [10, 44], [13, 45.5], [19, 42], [20, 40], [22, 37], [24, 38], [26, 41], [29, 41], [27, 37], [36, 36], [36, 45], [-10, 45]],
    [[80, 10], [82, 7], [81, 6], [80, 6], [79.8, 8]],
    [[95, 5], [98, 4], [104, -2], [106, -6], [102, -4], [96, 1]],
    [[105, -6], [114, -7], [114, -8.5], [106, -7.5]],
    [[109, 1], [110, -3], [116, -4], [119, 1], [117, 7], [113, 3]],
    [[119, -5], [121, -5], [121, 1], [125, 1], [120, 0]],
    [[120, 18], [122, 18], [124, 13], [126, 7], [125, 6], [122, 8], [120, 13]],
    [[33, 35], [34.5, 35.5], [34, 34.6]]
  ]; }
  function inPoly(px, py, poly) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }
  function heroMap(c) {
    if (!c) return;
    var x = c.getContext('2d'), W, H, D = Math.min(window.devicePixelRatio || 1, 2), T = 0, vis = true, base, bright, sc, ox, oy, LAND = getLand();
    var L0 = -22, L1 = 128, A0 = 46, A1 = -37, UAE = [55.3, 25.2], R = [];
    S.sourcing.africa.concat(S.sourcing.asia).forEach(function (n, i) {
      R.push({ k: n[0], name: n[1], lon: n[2], lat: n[3], sp: .0011 + (i % 7) * .00022, off: (i * .173) % 1.7, cyc: 1.7 });
    });
    var PL = [12, 0, 4, -2, -2, -11, -5, -11, -3, -2, -8, -1.5, -10, -5, -12, -5, -10, 0, -12, 5, -10, 5, -8, 1.5, -3, 2, -5, 11, -2, 11, 4, 2];
    function P(lon, lat) { return [ox + (lon - L0) * sc, oy + (A0 - lat) * sc]; }
    function size() {
      var r = c.parentNode.getBoundingClientRect(); W = r.width; H = r.height;
      c.width = W * D; c.height = H * D; x.setTransform(D, 0, 0, D, 0, 0);
      // cover the hero, keeping the UAE a little right of centre on wide screens
      sc = W < 700 ? W / (L1 - L0) * 2.3 : W < 1080 ? Math.max(W / (L1 - L0), H / (A0 - A1)) * 1.1 : Math.max(W / (L1 - L0), H / (A0 - A1)) * 1.3;
      var uxWant = W < 700 ? W * .5 : W < 1080 ? W * .55 : W * .6;
      ox = uxWant - (UAE[0] - L0) * sc; oy = H * (W < 700 ? .3 : W < 1080 ? .46 : .64) - (A0 - UAE[1]) * sc;
      if ((A0 - A1) * sc > H) oy = Math.min(0, Math.max(H - (A0 - A1) * sc, oy));
      if ((L1 - L0) * sc > W) ox = Math.min(0, Math.max(W - (L1 - L0) * sc, ox));
      var step = W < 700 ? 5 : 7, rad = W < 700 ? .95 : 1.05;
      base = document.createElement('canvas'); bright = document.createElement('canvas');
      [base, bright].forEach(function (cv) { cv.width = W * D; cv.height = H * D; cv.getContext('2d').setTransform(D, 0, 0, D, 0, 0); });
      var b = base.getContext('2d'), h = bright.getContext('2d');
      b.fillStyle = W < 700 ? 'rgba(130,160,240,.5)' : 'rgba(120,150,235,.42)'; h.fillStyle = 'rgba(150,185,255,.95)';
      for (var gy = step / 2; gy < H; gy += step) for (var gx = step / 2; gx < W; gx += step) {
        var lon = L0 + (gx - ox) / sc, lat = A0 - (gy - oy) / sc;
        for (var p = 0; p < LAND.length; p++) if (inPoly(lon, lat, LAND[p])) { b.beginPath(); b.arc(gx, gy, rad, 0, 7); b.fill(); h.beginPath(); h.arc(gx, gy, rad + .25, 0, 7); h.fill(); break; }
      }
    }
    function q(a, b, cc, t) { var u = 1 - t; return u * u * a + 2 * u * t * b + t * t * cc; }
    function flagC(code, fx, fy, w, h) {
      var f = window.flagParts(code), n = f.s.length;
      f.s.forEach(function (col, i) { x.fillStyle = col; if (f.v) x.fillRect(fx + w * i / n, fy, w / n + .5, h); else x.fillRect(fx, fy + h * i / n, w, h / n + .5); });
      if (f.b) { x.fillStyle = f.b; x.fillRect(fx, fy, w * .3, h); }
      if (f.d) { x.fillStyle = f.d; x.beginPath(); x.arc(fx + w * (f.b ? .65 : .5), fy + h / 2, h * .2, 0, 7); x.fill(); }
      x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 1; x.strokeRect(fx, fy, w, h);
    }
    function frame() {
      if (!document.body.contains(c)) return;
      T++;
      x.clearRect(0, 0, W, H);
      // map dots + a slow light sweep sliding across the continents
      x.globalAlpha = 1; x.drawImage(base, 0, 0, W, H);
      var bw = Math.max(220, W * .2), bx = reduce ? -9999 : ((T * 1.1) % (W + bw * 2)) - bw;
      for (var s = 0; s < 8; s++) { var w8 = bw / 8, sx = bx + s * w8, a = Math.sin((s + .5) / 8 * Math.PI); if (sx + w8 < 0 || sx > W) continue; x.globalAlpha = a * .75; x.drawImage(bright, sx * D, 0, w8 * D, H * D, sx, 0, w8, H); }
      var by = reduce ? -9999 : ((T * .55) % (H + 200)) - 100;
      x.globalAlpha = .35; x.drawImage(bright, 0, Math.max(0, by) * D, W * D, 40 * D, 0, Math.max(0, by), W, 40);
      x.globalAlpha = 1;
      var U = P(UAE[0], UAE[1]), ux = U[0], uy = U[1], sm = W < 700;
      R.forEach(function (r, i) {
        var o = P(r.lon, r.lat), x0 = o[0], y0 = o[1];
        if (x0 < -30 || x0 > W + 30 || y0 < -30 || y0 > H + 30) return;
        var dist = Math.hypot(ux - x0, uy - y0), cx = (x0 + ux) / 2, cy = (y0 + uy) / 2 - dist * .28;
        var raw = reduce ? .6 : (T * r.sp + r.off) % r.cyc, t = Math.min(raw, 1), flying = raw <= 1;
        x.strokeStyle = flying ? 'rgba(232,189,102,.22)' : 'rgba(140,170,255,.10)'; x.lineWidth = 1; x.setLineDash([3, 6]); x.lineDashOffset = -T * .3;
        x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(cx, cy, ux, uy); x.stroke(); x.setLineDash([]);
        // origin pulse when a plane departs
        if (flying && t < .2) { var pr = t / .2; x.strokeStyle = 'rgba(232,189,102,' + (.6 * (1 - pr)) + ')'; x.lineWidth = 1.2; x.beginPath(); x.arc(x0, y0, 6 + pr * 22, 0, 7); x.stroke(); }
        if (flying) {
          for (var k = 1; k < 16; k++) { var tt = t - k * .011; if (tt < 0) break; x.fillStyle = 'rgba(232,189,102,' + (.36 - k * .022) + ')'; x.beginPath(); x.arc(q(x0, cx, ux, tt), q(y0, cy, uy, tt), 1.5, 0, 7); x.fill(); }
          var px = q(x0, cx, ux, t), py = q(y0, cy, uy, t), ang = Math.atan2(2 * (1 - t) * (cy - y0) + 2 * t * (uy - cy), 2 * (1 - t) * (cx - x0) + 2 * t * (ux - cx)), s2 = sm ? .7 : .95;
          x.save(); x.translate(px, py); x.rotate(ang); x.scale(s2, s2); x.globalAlpha = t > .9 ? (1 - t) / .1 : Math.min(1, t / .05);
          x.shadowColor = 'rgba(232,189,102,.9)'; x.shadowBlur = 10; x.fillStyle = '#ffe7b0'; x.beginPath(); x.moveTo(PL[0], PL[1]); for (var m = 2; m < PL.length; m += 2) x.lineTo(PL[m], PL[m + 1]); x.closePath(); x.fill(); x.restore();
        }
        x.globalAlpha = flying ? .9 : .6; flagC(r.k, x0 - 8, y0 - 5.5, 16, 11); x.globalAlpha = 1;
        if (!sm && flying && t < .45) { x.globalAlpha = t < .35 ? Math.min(1, t / .06) : (.45 - t) / .1; x.fillStyle = 'rgba(232,236,250,.85)'; x.font = '600 11px "Plus Jakarta Sans",sans-serif'; x.fillText(r.name, x0 + 12, y0 + 4); x.globalAlpha = 1; }
      });
      for (var k2 = 0; k2 < 3; k2++) { var pp = ((T * .6 + k2 * 40) % 120) / 120; x.strokeStyle = 'rgba(232,189,102,' + (.5 * (1 - pp)) + ')'; x.lineWidth = 1.4; x.beginPath(); x.ellipse(ux, uy + 3, 8 + pp * 80, (8 + pp * 80) * .38, 0, 0, 7); x.stroke(); }
      var g = x.createRadialGradient(ux, uy, 0, ux, uy, 70); g.addColorStop(0, 'rgba(232,189,102,.35)'); g.addColorStop(1, 'rgba(232,189,102,0)'); x.fillStyle = g; x.beginPath(); x.arc(ux, uy, 70, 0, 7); x.fill();
      x.fillStyle = '#e8bd66'; x.beginPath(); x.arc(ux, uy, 6, 0, 7); x.fill(); x.strokeStyle = '#050914'; x.lineWidth = 2; x.stroke();
      x.fillStyle = 'rgba(220,220,220,.8)'; x.fillRect(ux - 1, uy - 48, 2, 42);
      var fx2 = ux + 1, fy2 = uy - 48, fw = 30, fh = 19;
      for (var ii = 0; ii < fw; ii += 2) { var o2 = reduce ? 0 : Math.sin(ii * .28 + T * .1) * 1.8; if (ii < fw * .28) { x.fillStyle = '#ff0000'; x.fillRect(fx2 + ii, fy2 + o2, 2.4, fh); } else { x.fillStyle = '#00732f'; x.fillRect(fx2 + ii, fy2 + o2, 2.4, fh / 3); x.fillStyle = '#fff'; x.fillRect(fx2 + ii, fy2 + o2 + fh / 3, 2.4, fh / 3); x.fillStyle = '#000'; x.fillRect(fx2 + ii, fy2 + o2 + 2 * fh / 3, 2.4, fh / 3); } }
      x.fillStyle = 'rgba(232,189,102,.95)'; x.font = '800 14px "Plus Jakarta Sans",sans-serif'; x.fillText('UAE', ux - 14, uy + 26);
      var la = P(18, 2), lb = P(88, 34); x.fillStyle = 'rgba(150,170,220,.28)'; x.font = '800 ' + (sm ? 11 : 13) + 'px "Plus Jakarta Sans",sans-serif'; x.fillText('A F R I C A', la[0], la[1]); x.fillText('A S I A', lb[0], lb[1]);
      if (vis && !reduce) requestAnimationFrame(frame);
    }
    size(); frame();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); if (reduce) frame(); }, 120); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { var was = vis; vis = es[0].isIntersecting; if (vis && !was && !reduce) requestAnimationFrame(frame); }).observe(c);
  }

  /* Satellites orbiting the 3D icon, with depth */
  function orbit() {
    var o = document.getElementById('i3dOrbit'), st = document.getElementById('i3dStage'), tl = document.getElementById('i3dTilt');
    if (!o) return;
    var sats = o.children, a = 0;
    (function step() {
      if (!document.body.contains(o)) return;
      var r = o.offsetWidth / 2;
      for (var i = 0; i < sats.length; i++) {
        var t = a + i * Math.PI * 2 / sats.length, z = Math.sin(t), sc = .72 + (z + 1) * .2;
        sats[i].style.transform = 'translate(' + Math.cos(t) * r + 'px,' + z * r * .32 + 'px) scale(' + sc + ')';
        sats[i].style.zIndex = z > 0 ? 5 : 1; sats[i].style.opacity = .45 + (z + 1) * .27;
      }
      a += .004; if (!reduce) requestAnimationFrame(step);
    })();
    if (window.matchMedia('(pointer:fine)').matches) {
      var hero = document.getElementById('hero');
      hero.addEventListener('mousemove', function (e) { var b = st.getBoundingClientRect(), dx = (e.clientX - b.left - b.width / 2) / b.width, dy = (e.clientY - b.top - b.height / 2) / b.height; tl.style.transform = 'rotateY(' + dx * 22 + 'deg) rotateX(' + -dy * 18 + 'deg)'; });
      hero.addEventListener('mouseleave', function () { tl.style.transform = ''; });
    }
  }

  /* 3D tilt + light glare on cards */
  function tilt() {
    if (reduce || !window.matchMedia('(pointer:fine)').matches) return;
    document.querySelectorAll('.card, .oi, .step, .feat-i, .aud-card, .ct, .vis-card, .stats > div, .float-card').forEach(function (el) {
      if (el.__tilt) return; el.__tilt = 1; el.classList.add('tilt');
      var max = el.classList.contains('vis-card') || el.classList.contains('aud-card') ? 5 : 9;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--gx', px * 100 + '%'); el.style.setProperty('--gy', py * 100 + '%');
        el.style.transform = 'perspective(900px) rotateX(' + (.5 - py) * max + 'deg) rotateY(' + (px - .5) * max + 'deg) translateY(-4px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }
  function toast(msg, err) {
    var t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.setAttribute('role', 'status'); t.innerHTML = I(err ? 'close' : 'check') + '<span>' + esc(msg) + '</span>';
    document.body.appendChild(t); requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 3200);
  }
})();
