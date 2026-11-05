/* RH Business Solutions — admin panel (vanilla JS, no build step).
 * Talks to admin/server.js. All user text is put on the page with textContent / value,
 * never innerHTML; innerHTML is only used for the fixed SVG icons from icons.js.
 */
(function () {
  'use strict';

  /* ---------- tiny DOM helper ---------- */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v; // only for trusted SVG
      else if (k === 'class') el.className = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { add(el, x); });
    else el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  // Like replaceChildren, but skips null/false children and flattens arrays.
  function put(el) { el.textContent = ''; for (var i = 1; i < arguments.length; i++) add(el, arguments[i]); }
  function ic(name, cls) { return h('span', { html: window.icon(name, cls || 'ic-sm'), style: 'display:inline-flex' }); }
  function flagEl(code) { return h('span', { html: /^[a-z]{2}$/.test(code || '') ? window.flag(code) : '', style: 'display:inline-flex' }); }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function fmtDate(s) { if (!s) return '—'; var d = new Date(s); return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); }
  function ago(s) {
    var m = Math.round((Date.now() - Date.parse(s)) / 60000);
    if (m < 1) return 'just now'; if (m < 60) return m + ' min ago';
    var hr = Math.round(m / 60); if (hr < 24) return hr + ' h ago';
    var d = Math.round(hr / 24); return d < 30 ? d + ' d ago' : fmtDate(s);
  }
  function size(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }

  var toastT;
  function toast(msg, bad) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.className = 'toast show' + (bad ? ' err' : '');
    clearTimeout(toastT); toastT = setTimeout(function () { t.className = 'toast' + (bad ? ' err' : ''); }, bad ? 5000 : 2600);
  }

  /* ---------- API ---------- */
  // The admin lives at /admin/, the API at /api/ (rewritten to admin/api.php by .htaccess).
  var API = window.RH_API || '../api/';
  var SITE = window.RH_SITE || '../';
  var NEWTAB = window.RH_DEMO ? null : '_blank';
  function src(u) { return /^(https:|data:)/.test(u) ? u : SITE + u; }
  function api(method, url, body) {
    var headers = { 'X-Requested-With': 'rh-admin' };
    if (method !== 'GET') { headers['Content-Type'] = 'application/json'; if (body === undefined) body = {}; }
    if (method !== 'GET' && method !== 'POST') { headers['X-Method'] = method; method = 'POST'; }
    return fetch(API + url.replace(/^\/api\//, ''), {
      method: method,
      credentials: 'same-origin',
      headers: headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (r.status === 401 && url !== '/api/auth/login' && url !== '/api/auth/me') { state.user = null; renderAuth(); }
        if (!r.ok) { var e = new Error(d.error || ('Request failed (' + r.status + ')')); e.status = r.status; e.data = d; throw e; }
        return d;
      });
    });
  }

  /* ---------- constants ---------- */
  var ICONS = 'users pin globe briefcase building code trending dashboard cart plane phone mail idcard hardhat clipboard passport file wallet cap shield link check arrow chevron menu close award target clock bed ticket bank search megaphone wrench layers chat lock card truck chart zap calendar star send eye heart'.split(' ');
  var VISUALS = [['network', 'Talent network map'], ['world', 'World map (overseas)'], ['uae', 'UAE map (7 emirates)'], ['travel', 'Boarding pass'], ['hr', 'Team overview'], ['setup', 'Company formation steps'], ['web', 'Browser window'], ['chart', 'Growth chart'], ['manage', 'Status tiles'], ['shop', 'Online store']];
  var KINDS = { general: 'Contact form', company: 'Hire staff', agent: 'Partner' };
  var STATUSES = [['new', 'New'], ['contacted', 'Contacted'], ['done', 'Done'], ['archived', 'Archived']];

  /* ---------- content schema (mirrors window.SITE — see CLAUDE.md "Content contract") ---------- */
  var T = {
    text: function (label, o) { return Object.assign({ t: 'text', label: label }, o); },
    area: function (label, o) { return Object.assign({ t: 'area', label: label }, o); },
    hl: function (label, o) { return Object.assign({ t: 'area', label: label, hl: true }, o); }
  };
  var SECTIONS = [
    { key: 'company', title: 'Company details', icon: 'building', desc: 'Name, contact details, logo and footer text shown on every page.',
      fields: [
        ['name', T.text('Full company name')], ['short', T.text('Short name', { help: 'Used in page titles and the header.' })], ['sub', T.text('Header sub-line')],
        ['logo', { t: 'image', label: 'Logo', help: 'Square image works best. Leave empty to show the RH monogram.' }],
        ['tagline', T.area('Tagline')], ['intro', T.area('Intro paragraph')],
        ['phone', T.text('Phone')], ['email', T.text('Email', { type: 'email' })],
        ['address', T.area('Office address')], ['city', T.text('City / country')],
        ['addressShort', T.text('Short address', { help: 'Shown in the top bar of every page, e.g. Al Nahda 1, Dubai · Mai Tower, 5th Floor.' })],
        ['map', { t: 'map', label: 'Map location', help: 'What Google Maps should search for: building and area (e.g. Mai Tower, Al Nahda 1, Dubai) or coordinates (e.g. 25.2896,55.3690). Used for the Contact page map and all map links.' }],
        ['footer', T.area('Footer text')], ['copyright', T.text('Copyright line')]
      ] },
    { key: 'nav', title: 'Menu', icon: 'menu', desc: 'Main menu links in the header.', list: true, itemTitle: 'label', newItem: { label: 'New link', href: 'index.html', page: '' },
      fields: [['label', T.text('Label')], ['href', T.text('Link', { help: 'A page such as about.html, or a full https:// address.' })], ['page', T.text('Page key', { help: 'Highlights the link on that page (home, about, services, portfolio, contact).' })], ['dropdown', { t: 'bool', label: 'Show the services drop-down' }]] },
    { key: 'hero', title: 'Home hero', icon: 'star', desc: 'The big banner at the top of the home page.',
      fields: [
        ['eyebrow', T.text('Small line above the title')], ['lead', T.text('Lead words', { help: 'Shown before the rotating words, e.g. "We Provide".' })],
        ['words', { t: 'list', label: 'Rotating words', itemTitle: 'text', newItem: { icon: 'star', text: 'New word', color: '#3d6bff' }, fields: [['icon', { t: 'icon', label: 'Icon' }], ['text', T.text('Word')], ['color', { t: 'color', label: 'Colour' }]] }],
        ['points', { t: 'strings', label: 'Points under the title' }]
      ] },
    { key: 'stats', title: 'Stats', icon: 'chart', desc: 'Number + label pairs.', list: true, itemTitle: 'value', newItem: { value: '0', label: 'New stat' }, fields: [['value', T.text('Number / value')], ['label', T.text('Label')]] },
    { key: 'services', title: 'Services', icon: 'briefcase', desc: 'Each service gets its own page (service-<id>.html), created automatically when you save.', list: true, itemTitle: 'name', itemSub: 'group', closed: true,
      newItem: { id: 'new-service', group: 'business', icon: 'star', name: 'New service', short: 'New service', summary: '', text: '', points: [], tags: [], visual: 'web' },
      fields: [
        ['name', T.text('Name')], ['short', T.text('Short name', { help: 'Used in menus and small cards.' })],
        ['id', T.text('Page id', { help: 'Lowercase letters, numbers and dashes. Changing it changes the page address.', pattern: '[a-z0-9]+(-[a-z0-9]+)*' })],
        ['group', { t: 'select', label: 'Group', options: [['recruitment', 'Recruitment & HR'], ['business', 'Business & digital']] }],
        ['icon', { t: 'icon', label: 'Icon' }], ['visual', { t: 'select', label: 'Picture on the service page', options: VISUALS }],
        ['image', { t: 'image', label: 'Photo (optional)', help: 'Stored with the service; shown once the front end supports service photos.' }],
        ['summary', T.hl('Summary (cards)')], ['text', T.area('Description (service page)')],
        ['points', { t: 'strings', label: 'What is included' }], ['tags', { t: 'strings', label: 'Tags' }]
      ] },
    { key: 'recruitmentItems', title: 'Recruitment items', icon: 'users', desc: 'The recruitment feature boxes.', list: true, itemTitle: 'title', newItem: { icon: 'star', title: 'New item', text: '' },
      fields: [['icon', { t: 'icon', label: 'Icon' }], ['title', T.text('Title')], ['text', T.hl('Text')]] },
    { key: 'process', title: 'Work process', icon: 'layers', desc: 'Business setup steps.', list: true, itemTitle: 'title', newItem: { title: 'New step', text: '' }, fields: [['title', T.text('Title')], ['text', T.area('Text')]] },
    { key: 'hiringSteps', title: 'Hiring steps', icon: 'clipboard', desc: '"How hiring works" steps.', list: true, itemTitle: 'title', newItem: { title: 'New step', text: '' }, fields: [['title', T.text('Title')], ['text', T.area('Text')]] },
    { key: 'projects', title: 'Portfolio', icon: 'award', desc: 'Projects on the portfolio page. The category is used for the filter buttons.', list: true, itemTitle: 'title', itemSub: 'category', newItem: { icon: 'star', title: 'New project', category: 'Web Development', text: '' },
      fields: [['icon', { t: 'icon', label: 'Icon' }], ['title', T.text('Title')], ['category', T.text('Category', { suggest: function () { return uniq(state.draft.projects.map(function (p) { return p.category; })); } })], ['text', T.area('Text')], ['image', { t: 'image', label: 'Photo (optional)', help: 'Stored with the project; shown once the front end supports project photos.' }]] },
    { key: 'sourcing', title: 'Sourcing countries', icon: 'globe', desc: 'Countries we recruit from. Longitude/latitude place the plane routes on the home map.',
      fields: [['africa', { t: 'tuples', label: 'Africa', pos: true }], ['asia', { t: 'tuples', label: 'Asia', pos: true }]] },
    { key: 'emirates', title: 'Emirates', icon: 'pin', desc: 'Emirates covered for local hiring.', strings: true },
    { key: 'destinations', title: 'Travel destinations', icon: 'plane', desc: 'Visit-visa destinations on the Travel & Tour page.',
      fields: [['asia', { t: 'tuples', label: 'Asia' }], ['world', { t: 'tuples', label: 'Rest of the world' }]] }
  ];
  function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }

  /* ---------- state ---------- */
  var state = { user: null, content: null, draft: null, meta: {}, dirty: false, view: 'dashboard', leads: null, leadId: null, open: {} };
  function markDirty() { state.dirty = true; updateState(); }
  window.addEventListener('beforeunload', function (e) { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- auth screens ---------- */
  var app = document.getElementById('app');
  function logo() { return h('div', { class: 'logo' }, h('span', { class: 'mark' }, 'RH'), h('span', null, h('b', { text: 'RH Business Solutions' }), h('small', { text: 'Admin panel' }))); }
  function renderAuth() {
    app.className = '';
    api('GET', '/api/auth/setup').then(function (s) {
      var setup = s.needsSetup, needsDb = s.needsDb, msg = h('p', { class: 'err-msg', hidden: true });
      var fld = function (label, attrs, help) { return h('label', { class: 'fld' }, h('span', { text: label }), h('input', attrs), help ? h('em', { text: help }) : null); };
      var drivers = s.drivers || ['mysql'];
      var dbBox = needsDb ? h('fieldset', { class: 'dbset' },
        h('legend', { text: 'Database' }),
        h('p', { class: 'desc', text: 'Create a MySQL database in Hostinger hPanel → Databases → Management, then enter its details here.' }),
        drivers.length > 1 ? h('label', { class: 'fld' }, h('span', { text: 'Type' }), h('select', { name: 'driver', onchange: function () { mysqlBox.hidden = f.driver.value !== 'mysql'; } },
          h('option', { value: 'mysql', text: 'MySQL / MariaDB (recommended)' }), h('option', { value: 'sqlite', text: 'SQLite file (local testing)' }))) : null,
        (mysqlBox = h('div', null,
          fld('Database name', { name: 'dbname', autocomplete: 'off', placeholder: 'u123456789_rh' }),
          fld('Database user', { name: 'dbuser', autocomplete: 'off', placeholder: 'u123456789_rhadmin' }),
          fld('Database password', { name: 'dbpass', type: 'password', autocomplete: 'new-password' }),
          fld('Host', { name: 'dbhost', value: 'localhost', autocomplete: 'off' }, 'Leave as localhost on Hostinger.')))) : null;
      var mysqlBox;
      var code = h('label', { class: 'fld', hidden: true }, h('span', { text: 'Two-step code' }), h('input', { name: 'code', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: 8, placeholder: '123 456' }), h('em', { text: 'The 6-digit code from your authenticator app.' }));
      var f = h('form', { class: 'auth-card', novalidate: true },
        logo(),
        h('h1', { text: setup ? (needsDb ? 'Install the admin panel' : 'Create the owner account') : 'Sign in' }),
        h('p', { class: 'desc', text: setup ? 'First run: connect the database and create the owner account. The owner manages the website and adds other users.' : 'Manage the website content and form enquiries.' }),
        msg, dbBox,
        setup ? h('div', { class: 'nav-g', style: 'margin:6px 0 10px', text: needsDb ? 'Owner account' : '' }) : null,
        setup ? fld('Your name', { name: 'name', autocomplete: 'name' }) : null,
        fld('Email', { name: 'email', type: 'email', autocomplete: 'username', required: true }),
        fld('Password', { name: 'password', type: 'password', autocomplete: setup ? 'new-password' : 'current-password', required: true }, setup ? 'At least 10 characters. Use a strong, unique password.' : ''),
        code,
        h('button', { class: 'btn primary', type: 'submit', style: 'width:100%;margin-top:6px' }, setup ? (needsDb ? 'Install & create account' : 'Create account') : 'Sign in')
      );
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var b = f.querySelector('button[type=submit]'); b.disabled = true; msg.hidden = true;
        var body = { email: f.email.value, password: f.password.value };
        if (setup) body.name = f.name.value;
        if (needsDb) body.db = { driver: f.driver ? f.driver.value : 'mysql', name: f.dbname.value, user: f.dbuser.value, pass: f.dbpass.value, host: f.dbhost.value };
        if (!code.hidden) body.code = f.code.value;
        api('POST', setup ? '/api/auth/setup' : '/api/auth/login', body).then(function (d) { state.user = d.user; start(); })
          .catch(function (er) {
            if (er.data && er.data.need2fa) { code.hidden = false; f.code.focus(); }
            msg.textContent = er.message; msg.hidden = false; b.disabled = false;
          });
      });
      put(app, h('div', { class: 'auth' }, f));
      (needsDb ? f.dbname : setup ? f.name : f.email).focus();
    }).catch(function () { app.textContent = 'Cannot reach the server. Check that PHP is enabled and the .htaccess file was uploaded.'; });
  }

  /* ---------- shell ---------- */
  var els = {};
  function start() {
    Promise.all([api('GET', '/api/content'), api('GET', '/api/content/meta')]).then(function (r) {
      state.content = r[0]; state.draft = clone(r[0]); state.meta = r[1]; state.dirty = false;
      renderShell(); route();
    }).catch(function (e) { toast(e.message, true); });
  }
  function navLink(id, label, icon, badge) {
    return h('a', { href: '#' + id, 'data-v': id }, ic(icon), label, badge || null);
  }
  function renderShell() {
    app.className = '';
    els.newBadge = h('span', { class: 'badge', hidden: true });
    els.state = h('span', { class: 'state clean', text: 'Saved' });
    els.save = h('button', { class: 'btn primary', onclick: save }, ic('check'), h('span', { class: 'lbl', text: 'Save' }));
    els.title = h('h1');
    els.view = h('div', { class: 'view' });
    var side = h('aside', { class: 'side' },
      logo(),
      h('nav', { class: 'nav' },
        navLink('dashboard', 'Dashboard', 'dashboard'),
        navLink('leads', 'Leads inbox', 'mail', els.newBadge),
        navLink('preview', 'Website preview', 'globe'),
        h('div', { class: 'nav-g', text: 'Website content' }),
        SECTIONS.map(function (s) { return navLink('c/' + s.key, s.title, s.icon); }),
        h('div', { class: 'nav-g', text: 'Manage' }),
        navLink('media', 'Images', 'eye'),
        navLink('history', 'Versions', 'clock'),
        state.user.role === 'owner' ? navLink('users', 'Users', 'lock') : null,
        state.user.role === 'owner' ? navLink('activity', 'Activity log', 'clipboard') : null,
        state.user.role === 'owner' ? navLink('settings', 'Settings', 'wrench') : null,
        navLink('account', 'My account', 'idcard')
      ),
      h('div', { class: 'side-foot' }, h('b', { text: state.user.name || state.user.email }), h('small', { text: state.user.role === 'owner' ? 'Owner' : 'Editor' }),
        h('div', { class: 'inline', style: 'margin-top:10px' }, h('a', { class: 'btn sm', href: SITE, target: NEWTAB, rel: 'noopener' }, 'View site'), h('button', { class: 'btn sm ghost', onclick: logout }, 'Sign out')))
    );
    els.shell = h('div', { class: 'shell' }, side,
      h('div', { class: 'main' },
        h('header', { class: 'top' }, h('button', { class: 'btn icon menu-btn', 'aria-label': 'Menu', onclick: function () { els.shell.classList.toggle('nav-open'); } }, ic('menu')), els.title, els.state, els.save, h('a', { class: 'btn', href: SITE, target: NEWTAB, rel: 'noopener', title: 'Open the website' }, ic('globe'), h('span', { class: 'lbl', text: 'View site' }))),
        els.view));
    side.addEventListener('click', function (e) { if (e.target.closest('a[data-v]')) els.shell.classList.remove('nav-open'); });
    put(app, els.shell);
    updateState(); refreshBadge();
  }
  function updateState() {
    if (!els.state) return;
    els.state.className = 'state ' + (state.dirty ? 'dirty' : 'clean');
    els.state.textContent = state.dirty ? 'Unsaved changes' : 'All changes live';
    els.save.disabled = !state.dirty;
  }
  function refreshBadge() {
    api('GET', '/api/dashboard').then(function (d) { els.newBadge.textContent = d.leads.new; els.newBadge.hidden = !d.leads.new; }).catch(function () {});
  }
  function logout() {
    var go = function () { state.dirty = false; api('POST', '/api/auth/logout', {}).finally(function () { state.user = null; renderAuth(); }); };
    if (state.dirty) ask('You have unsaved changes. Sign out anyway?', 'Sign out', go); else go();
  }

  /* ---------- routing ---------- */
  window.addEventListener('hashchange', function () { if (state.user) route(); });
  function route() {
    var v = location.hash.slice(1) || 'dashboard';
    state.view = v;
    document.querySelectorAll('.nav a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-v') === v || (v.indexOf('leads') === 0 && a.getAttribute('data-v') === 'leads')); });
    window.scrollTo(0, 0);
    if (v.indexOf('c/') === 0) {
      var s = SECTIONS.filter(function (x) { return x.key === v.slice(2); })[0];
      if (s) return show(s.title, contentView(s));
    }
    var views = { dashboard: ['Dashboard', dashboardView], leads: ['Leads inbox', leadsView], media: ['Images', mediaView], history: ['Versions', historyView], activity: ['Activity log', activityView], settings: ['Settings', settingsView], preview: ['Website preview', previewView], users: ['Users', usersView], account: ['My account', accountView] };
    var x = views[v] || views.dashboard;
    show(x[0], x[1]());
  }
  function show(title, node) { els.title.textContent = title; document.title = title + ' · RH Admin'; put(els.view, node); }

  /* ---------- save & publish ---------- */
  function save(force) {
    var problems = check(state.draft);
    if (problems.length) { toast(problems[0], true); return Promise.reject(); }
    els.save.disabled = true;
    return api('PUT', '/api/content', { content: state.draft, base: state.meta.version, force: force === true }).then(function (d) {
      state.content = clone(state.draft); state.meta = d.meta; state.dirty = false; updateState();
      toast('Saved — the website is updated.');
    }).catch(function (e) {
      els.save.disabled = false;
      if (e.status === 409) ask(e.message + ' Overwrite their changes with yours?', 'Overwrite', function () { save(true); });
      else toast(e.message, true);
      throw e;
    });
  }
  function check(c) {
    var out = [], ids = {};
    c.services.forEach(function (s, i) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id || '')) out.push('Service ' + (i + 1) + ' (' + (s.name || 'no name') + '): page id may only use lowercase letters, numbers and dashes.');
      if (ids[s.id]) out.push('Two services use the page id "' + s.id + '".');
      ids[s.id] = 1;
    });
    if (!c.company.name || !c.company.email || !c.company.phone) out.push('Company name, phone and email are required.');
    return out;
  }
  /* ---------- dashboard ---------- */
  function dashboardView() {
    var box = h('div', null, h('p', { class: 'empty', text: 'Loading…' }));
    api('GET', '/api/dashboard').then(function (d) {
      var tile = function (label, value, icon, href, accent) { return h(href ? 'a' : 'div', { class: 'tile' + (accent ? ' accent' : ''), href: href }, h('small', null, ic(icon), label), h('b', { text: String(value) })); };
      var m = d.meta || {};
      put(box, 
        m.savedAt ? h('div', { class: 'notice ok' }, ic('check', 'ic'), h('p', { text: 'Website content last updated ' + ago(m.savedAt) + ' by ' + (m.savedBy || '—') + '.' })) : null,
        h('div', { class: 'tiles' },
          tile('New leads', d.leads.new, 'mail', '#leads', true), tile('Leads this week', d.leads.week, 'calendar', '#leads'), tile('All leads', d.leads.total, 'users', '#leads'),
          tile('Hire staff requests', d.leads.byKind.company, 'briefcase', '#leads'), tile('Partner requests', d.leads.byKind.agent, 'link', '#leads'), tile('Contact messages', d.leads.byKind.general, 'chat', '#leads')),
        h('div', { class: 'card' }, h('h2', { text: 'Quick actions' }), h('div', { class: 'quick' },
          h('a', { class: 'btn', href: '#leads' }, ic('mail'), 'Open leads inbox'),
          h('a', { class: 'btn', href: '#c/services' }, ic('briefcase'), 'Edit services'),
          h('a', { class: 'btn', href: '#c/company' }, ic('building'), 'Company details'),
          h('a', { class: 'btn', href: '#c/projects' }, ic('award'), 'Portfolio'),
          h('a', { class: 'btn', href: '#media' }, ic('eye'), 'Upload images'),
          h('a', { class: 'btn', href: SITE, target: NEWTAB, rel: 'noopener' }, ic('globe'), 'View website'))),
        h('div', { class: 'card' }, h('h2', { text: 'Latest enquiries' }),
          d.recent.length ? h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('tbody', null, d.recent.map(function (l) {
            return h('tr', null, h('td', null, h('a', { href: '#leads/' + l.id }, h('b', { text: l.name || l.email || 'No name' }))), h('td', { text: KINDS[l.kind] }), h('td', { text: l.company || l.email }), h('td', null, h('span', { class: 'pill ' + l.status, text: l.status })), h('td', { text: ago(l.createdAt) }));
          })))) : h('p', { class: 'empty', text: 'No enquiries yet. Form submissions from the website appear here.' })),
        h('div', { class: 'tiles' },
          tile('Services', d.content.services, 'briefcase', '#c/services'), tile('Portfolio projects', d.content.projects, 'award', '#c/projects'),
          tile('Sourcing countries', d.content.countries, 'globe', '#c/sourcing'), tile('Travel destinations', d.content.destinations, 'plane', '#c/destinations'), tile('Images', d.content.uploads, 'eye', '#media'))
      );
    }).catch(function (e) { put(box, h('p', { class: 'err-msg', text: e.message })); });
    return box;
  }

  /* ---------- content editor ---------- */
  function contentView(s) {
    var wrap = h('div');
    function render() {
      var node;
      if (s.strings) node = h('div', { class: 'card' }, h('p', { class: 'desc', text: s.desc }), stringsField(state.draft, s.key, { label: s.title }));
      else if (s.list) node = h('div', null, h('p', { class: 'desc', text: s.desc }), listField(state.draft, s.key, s, render));
      else node = h('div', { class: 'card' }, h('p', { class: 'desc', text: s.desc }), fieldsFor(state.draft[s.key], s.fields, render, s.key));
      put(wrap, node);
    }
    render();
    return wrap;
  }
  function fieldsFor(obj, fields, rerender, path) {
    return fields.map(function (f) { return field(obj, f[0], f[1], rerender, path + '.' + f[0]); });
  }
  function label(def, control, extra) {
    return h('label', { class: 'fld' }, h('span', { text: def.label }), control, extra || null, def.help ? h('em', { text: def.help }) : null);
  }
  function field(obj, key, def, rerender, path) {
    var set = function (v) { obj[key] = v; markDirty(); };
    var v = obj[key];
    switch (def.t) {
      case 'text': {
        var listId = def.suggest ? 'dl-' + path.replace(/\W/g, '') : null;
        var inp = h('input', { type: def.type || 'text', value: v == null ? '' : v, pattern: def.pattern, list: listId, oninput: function () { set(inp.value); } });
        return label(def, inp, listId ? h('datalist', { id: listId }, def.suggest().map(function (o) { return h('option', { value: o }); })) : null);
      }
      case 'area': {
        var prev = def.hl ? h('div', { class: 'hl-prev' }) : null;
        var ta = h('textarea', { rows: 3, value: v == null ? '' : v, oninput: function () { set(ta.value); if (prev) hlPreview(prev, ta.value); } });
        if (prev) hlPreview(prev, ta.value);
        return label(def, ta, def.hl ? [h('span', { class: 'hl-help', text: 'Wrap words in **double stars** to highlight them in gold.' }), prev] : null);
      }
      case 'bool':
        return h('div', { class: 'fld' }, h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!v, onchange: function (e) { if (e.target.checked) set(true); else { delete obj[key]; markDirty(); } } }), def.label));
      case 'select': {
        var sel = h('select', { onchange: function () { set(sel.value); } }, def.options.map(function (o) { return h('option', { value: o[0], text: o[1] }); }));
        if (v && !def.options.some(function (o) { return o[0] === v; })) sel.appendChild(h('option', { value: v, text: v }));
        sel.value = v || def.options[0][0];
        return label(def, sel);
      }
      case 'color': {
        var c = h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(v || '') ? v : '#3d6bff' });
        var tx = h('input', { type: 'text', value: v || '', style: 'max-width:120px', placeholder: '#3d6bff' });
        c.addEventListener('input', function () { tx.value = c.value; set(c.value); });
        tx.addEventListener('input', function () { if (/^#[0-9a-f]{3,8}$/i.test(tx.value)) { set(tx.value); if (tx.value.length === 7) c.value = tx.value; } });
        return h('div', { class: 'fld' }, h('span', { text: def.label }), h('div', { class: 'inline' }, c, tx));
      }
      case 'icon': {
        var pv = h('span', { class: 'icon-prev', html: window.icon(v || 'star', 'ic') });
        var nm = h('span', { text: v || 'star' });
        return h('div', { class: 'fld' }, h('span', { text: def.label }), h('div', { class: 'iconfld' }, pv, nm, h('button', { class: 'btn sm', type: 'button', onclick: function () {
          pickIcon(obj[key], function (name) { set(name); pv.innerHTML = window.icon(name, 'ic'); nm.textContent = name; });
        } }, 'Change')));
      }
      case 'map': {
        var mi = h('input', { type: 'text', value: v || '', placeholder: 'Mai Tower, Al Nahda 1, Dubai', oninput: function () { set(mi.value.trim()); } });
        var check = h('a', { class: 'btn sm', target: '_blank', rel: 'noopener', onclick: function () { check.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mi.value.trim() || obj.address || ''); } }, ic('pin'), 'Check on Google Maps');
        check.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(v || obj.address || '');
        return h('div', { class: 'fld' }, h('span', { text: def.label }), h('div', { class: 'inline' }, h('div', { class: 'grow' }, mi), check), h('em', { text: def.help }));
      }
      case 'image': return imageField(obj, key, def);
      case 'strings': return stringsField(obj, key, def);
      case 'list': return h('div', { class: 'fld' }, h('span', { text: def.label }), listField(obj, key, def, rerender));
      case 'tuples': return tuplesField(obj, key, def);
    }
    return null;
  }
  function hlPreview(el, s) {
    put(el);
    String(s || '').split(/(\*\*.+?\*\*)/).forEach(function (part) {
      if (/^\*\*.+\*\*$/.test(part)) el.appendChild(h('mark', { text: part.slice(2, -2) }));
      else if (part) el.appendChild(document.createTextNode(part));
    });
  }
  function imageField(obj, key, def) {
    var pv = h('div', { class: 'img-prev' });
    function paint() { var v = obj[key]; pv.style.backgroundImage = v ? 'url("' + src(v).replace(/"/g, '%22') + '")' : ''; pv.textContent = v ? '' : 'None'; rm.hidden = !v; }
    var rm = h('button', { class: 'btn sm danger', type: 'button', onclick: function () { obj[key] = ''; if (key !== 'logo') delete obj[key]; markDirty(); paint(); } }, 'Remove');
    var node = h('div', { class: 'fld' }, h('span', { text: def.label }), h('div', { class: 'imgfld' }, pv,
      h('button', { class: 'btn sm', type: 'button', onclick: function () { pickImage(function (url) { obj[key] = url; markDirty(); paint(); }); } }, 'Choose image'), rm),
      def.help ? h('em', { text: def.help }) : null);
    paint();
    return node;
  }
  function stringsField(obj, key, def) {
    if (!Array.isArray(obj[key])) obj[key] = [];
    var arr = obj[key], box = h('div', { class: 'mini' });
    function render() {
      put(box, arr.map(function (s, i) {
        var inp = h('input', { type: 'text', value: s, oninput: function () { arr[i] = inp.value; markDirty(); } });
        return h('div', { class: 'mini-row' }, inp,
          h('button', { class: 'btn icon sm ghost', type: 'button', title: 'Move up', disabled: i === 0, onclick: function () { move(arr, i, -1); render(); } }, ic('chevron', 'ic-sm rot180')),
          h('button', { class: 'btn icon sm danger', type: 'button', title: 'Remove', onclick: function () { arr.splice(i, 1); markDirty(); render(); } }, ic('close')));
      }), h('div', null, h('button', { class: 'btn sm', type: 'button', onclick: function () { arr.push(''); markDirty(); render(); var all = box.querySelectorAll('input'); all[all.length - 1].focus(); } }, '+ Add')));
    }
    render();
    return h('div', { class: 'fld' }, h('span', { text: def.label }), box);
  }
  function move(arr, i, d) { var j = i + d; if (j < 0 || j >= arr.length) return; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; markDirty(); }
  function listField(obj, key, def, rerender) {
    if (!Array.isArray(obj[key])) obj[key] = [];
    var arr = obj[key], box = h('div'), openKey = def.key || key;
    function render() {
      put(box, h('div', { class: 'items' }, arr.map(function (item, i) {
        var id = openKey + ':' + i;
        var isOpen = state.open[id] != null ? state.open[id] : !def.closed;
        var ttl = h('span', { class: 'ttl' }, String(item[def.itemTitle] || '(untitled)'), def.itemSub && item[def.itemSub] ? h('small', { text: item[def.itemSub] }) : null);
        var body = h('div', { class: 'item-b' }, fieldsFor(item, def.fields, render, key + '[' + i + ']'));
        body.addEventListener('input', function () { ttl.firstChild.textContent = String(item[def.itemTitle] || '(untitled)'); });
        var el = h('div', { class: 'item' + (isOpen ? '' : ' closed') },
          h('div', { class: 'item-h', onclick: function (e) { if (e.target.closest('button')) return; state.open[id] = el.classList.toggle('closed') ? false : true; } },
            ic('chevron', 'ic-sm chev'), h('span', { class: 'num', text: String(i + 1) }), item.icon ? ic(item.icon) : null, ttl,
            h('span', { class: 'tools' },
              h('button', { class: 'btn icon sm ghost', type: 'button', title: 'Move up', disabled: i === 0, onclick: function () { move(arr, i, -1); swapOpen(i, i - 1); render(); } }, '↑'),
              h('button', { class: 'btn icon sm ghost', type: 'button', title: 'Move down', disabled: i === arr.length - 1, onclick: function () { move(arr, i, 1); swapOpen(i, i + 1); render(); } }, '↓'),
              h('button', { class: 'btn icon sm ghost opt', type: 'button', title: 'Duplicate', onclick: function () { var c = clone(item); if (c.id) c.id += '-copy'; arr.splice(i + 1, 0, c); markDirty(); render(); } }, '⧉'),
              h('button', { class: 'btn icon sm danger', type: 'button', title: 'Delete', onclick: function () { ask('Delete "' + (item[def.itemTitle] || 'this item') + '"? This takes effect when you save.', 'Delete', function () { arr.splice(i, 1); markDirty(); render(); }); } }, ic('close')))),
          body);
        return el;
      })), h('button', { class: 'btn', type: 'button', onclick: function () { arr.push(clone(def.newItem)); state.open[openKey + ':' + (arr.length - 1)] = true; markDirty(); render(); } }, '+ Add ' + (def.title ? def.title.toLowerCase().replace(/s$/, '') : 'item')));
    }
    function swapOpen(a, b) { var x = state.open[openKey + ':' + a], y = state.open[openKey + ':' + b]; state.open[openKey + ':' + a] = y; state.open[openKey + ':' + b] = x; }
    render();
    return box;
  }
  function tuplesField(obj, key, def) {
    if (!Array.isArray(obj[key])) obj[key] = [];
    var arr = obj[key], box = h('div', { class: 'mini' });
    function render() {
      put(box, 
        h('div', { class: 'tuple tuple-head' + (def.pos ? '' : ' short') }, h('span', { text: 'Flag' }), h('span', { text: 'Code' }), h('span', { text: 'Country' }), def.pos ? h('span', { text: 'Longitude' }) : null, def.pos ? h('span', { text: 'Latitude' }) : null, h('span')),
        arr.map(function (t, i) {
          var fb = h('span', { class: 'flagbox' }, flagEl(t[0]));
          var code = h('input', { type: 'text', value: t[0], maxlength: 2, title: '2-letter country code (ISO), e.g. ke', oninput: function () { t[0] = code.value.toLowerCase().trim(); put(fb, flagEl(t[0])); markDirty(); } });
          var name = h('input', { type: 'text', value: t[1], oninput: function () { t[1] = name.value; markDirty(); } });
          var num = function (j, ph) { var n = h('input', { type: 'number', step: '0.1', class: 'num-in', placeholder: ph, value: t[j], oninput: function () { t[j] = n.value === '' ? 0 : +n.value; markDirty(); } }); return n; };
          return h('div', { class: 'tuple' + (def.pos ? '' : ' short') }, fb, code, name, def.pos ? num(2, 'lon') : null, def.pos ? num(3, 'lat') : null,
            h('button', { class: 'btn icon sm danger', type: 'button', title: 'Remove', onclick: function () { arr.splice(i, 1); markDirty(); render(); } }, ic('close')));
        }),
        h('div', null, h('button', { class: 'btn sm', type: 'button', onclick: function () { arr.push(def.pos ? ['', '', 0, 0] : ['', '']); markDirty(); render(); } }, '+ Add country')));
    }
    render();
    return h('div', { class: 'fld', style: 'margin-bottom:22px' }, h('span', { text: def.label + ' (' + arr.length + ')' }), def.pos ? h('em', { text: 'Flags are drawn for the codes the website knows; others show a grey flag.' }) : null, box);
  }

  /* ---------- modals ---------- */
  function modal(title, body) {
    var m = h('div', { class: 'modal', onclick: function (e) { if (e.target === m) close(); } },
      h('div', { class: 'modal-box', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, h('div', { class: 'modal-h' }, h('h2', { text: title }), h('button', { class: 'btn icon sm', onclick: close, 'aria-label': 'Close' }, ic('close'))), body));
    function esc(e) { if (e.key === 'Escape') close(); }
    function close() { m.remove(); document.removeEventListener('keydown', esc); }
    document.addEventListener('keydown', esc);
    document.body.appendChild(m);
    return close;
  }
  // In-page confirmation (browser confirm() is blocked in some embedded views).
  function ask(message, okLabel, onOk) {
    var close = modal('Please confirm', h('div', null, h('p', { text: message, style: 'color:var(--ink);margin:0 0 18px' }),
      h('div', { class: 'inline', style: 'justify-content:flex-end' },
        h('button', { class: 'btn', type: 'button', onclick: function () { close(); } }, 'Cancel'),
        h('button', { class: 'btn ' + (/delete|remove/i.test(okLabel) ? 'danger' : 'primary'), type: 'button', onclick: function () { close(); onOk(); } }, okLabel))));
    var b = document.querySelector('.modal:last-child .btn.danger, .modal:last-child .btn.primary'); if (b) b.focus();
  }
  function pickIcon(current, done) {
    var close = modal('Choose an icon', h('div', { class: 'icon-grid' }, ICONS.map(function (n) {
      return h('button', { type: 'button', class: n === current ? 'on' : '', onclick: function () { done(n); markDirty(); close(); } }, h('span', { html: window.icon(n, 'ic') }), n);
    })));
  }
  function pickImage(done) {
    var grid = h('div', { class: 'media-grid' }, h('p', { class: 'empty', text: 'Loading…' }));
    var close = modal('Choose an image', h('div', null, uploader(load), grid));
    function load() {
      api('GET', '/api/uploads').then(function (list) {
        put(grid, list.length ? list.map(function (f) {
          return h('button', { class: 'media', type: 'button', onclick: function () { done(f.url); close(); } }, h('div', { class: 'pic', style: 'background-image:url("' + src(f.url) + '")' }), h('div', { class: 'meta', text: f.name }));
        }) : [h('p', { class: 'empty', text: 'No images yet — upload one above.' })]);
      });
    }
    load();
  }
  function uploader(after) {
    var input = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', multiple: true, hidden: true, onchange: function () { send(input.files); input.value = ''; } });
    var drop = h('div', { class: 'drop' }, 'Drag images here or ', h('button', { class: 'btn sm', type: 'button', onclick: function () { input.click(); } }, 'choose files'), h('div', { style: 'font-size:.78rem;margin-top:6px', text: 'PNG, JPG, WebP or GIF · up to 5 MB each' }), input);
    drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', function () { drop.classList.remove('over'); });
    drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('over'); send(e.dataTransfer.files); });
    function send(files) {
      Array.prototype.reduce.call(files, function (p, file) {
        return p.then(function () {
          if (file.size > 5 * 1024 * 1024) { toast(file.name + ' is larger than 5 MB.', true); return; }
          return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.readAsDataURL(file); })
            .then(function (url) { return api('POST', '/api/uploads', { name: file.name, type: file.type, data: String(url).split(',')[1] }); })
            .then(function () { toast('Uploaded ' + file.name); }).catch(function (e) { toast(e.message, true); });
        });
      }, Promise.resolve()).then(after);
    }
    return drop;
  }

  /* ---------- leads ---------- */
  function leadsView() {
    var parts = state.view.split('/'); if (parts[1]) state.leadId = parts[1];
    var f = { q: '', kind: '', status: 'open' };
    var list = h('div', { class: 'lead-list' }), detail = h('div', { class: 'card' }, h('p', { class: 'empty', text: 'Select an enquiry to read it.' }));
    var q = h('input', { type: 'search', placeholder: 'Search name, email, text…', oninput: function () { f.q = q.value.toLowerCase(); paint(); } });
    var kind = h('select', { onchange: function () { f.kind = kind.value; paint(); } }, h('option', { value: '', text: 'All types' }), Object.keys(KINDS).map(function (k) { return h('option', { value: k, text: KINDS[k] }); }));
    var st = h('select', { onchange: function () { f.status = st.value; paint(); } }, h('option', { value: 'open', text: 'Not archived' }), h('option', { value: '', text: 'All statuses' }), STATUSES.map(function (s) { return h('option', { value: s[0], text: s[1] }); }));
    function paint() {
      var leads = (state.leads || []).filter(function (l) {
        if (f.kind && l.kind !== f.kind) return false;
        if (f.status === 'open' ? l.status === 'archived' : f.status && l.status !== f.status) return false;
        return !f.q || JSON.stringify([l.name, l.email, l.phone, l.company, l.fields, l.note]).toLowerCase().indexOf(f.q) >= 0;
      });
      put(list, leads.length ? leads.map(function (l) {
        return h('button', { class: 'lead' + (l.id === state.leadId ? ' on' : '') + (l.status === 'new' ? ' unread' : ''), type: 'button', onclick: function () { state.leadId = l.id; history.replaceState(null, '', '#leads/' + l.id); paint(); } },
          h('span', { class: 'l1' }, h('b', { text: l.name || l.email || 'No name' }), h('span', { class: 'pill ' + l.status, text: l.status })),
          h('small', { text: KINDS[l.kind] + (l.company ? ' · ' + l.company : '') }),
          h('small', { text: ago(l.createdAt) }));
      }) : [h('p', { class: 'empty', text: state.leads && state.leads.length ? 'No enquiries match the filters.' : 'No enquiries yet.' })]);
      var cur = (state.leads || []).filter(function (l) { return l.id === state.leadId; })[0];
      if (cur) showLead(cur); else put(detail, h('p', { class: 'empty', text: 'Select an enquiry to read it.' }));
    }
    function showLead(l) {
      var note = h('textarea', { rows: 3, value: l.note || '', placeholder: 'Private note for your team' });
      var sel = h('select', null, STATUSES.map(function (s) { return h('option', { value: s[0], text: s[1] }); })); sel.value = l.status;
      var subject = 'Re: your ' + (l.kind === 'company' ? 'hiring request' : l.kind === 'agent' ? 'partnership request' : 'enquiry') + ' — ' + state.content.company.short;
      put(detail, 
        h('div', { class: 'inline', style: 'margin-bottom:12px' }, h('h2', { class: 'grow', style: 'margin:0', text: l.name || l.email || 'Enquiry' }), h('span', { class: 'pill', text: KINDS[l.kind] })),
        h('p', { class: 'desc', text: 'Received ' + fmtDate(l.createdAt) + (l.page ? ' · from ' + l.page : '') }),
        h('div', { class: 'quick', style: 'margin-bottom:16px' },
          l.email ? h('a', { class: 'btn primary sm', href: 'mailto:' + encodeURIComponent(l.email).replace(/%40/g, '@') + '?subject=' + encodeURIComponent(subject) }, ic('mail'), 'Reply by email') : null,
          l.phone ? h('a', { class: 'btn sm', href: 'tel:' + l.phone.replace(/[^+\d]/g, '') }, ic('phone'), 'Call') : null,
          l.phone ? h('a', { class: 'btn sm', href: 'https://wa.me/' + l.phone.replace(/\D/g, ''), target: NEWTAB, rel: 'noopener' }, ic('chat'), 'WhatsApp') : null),
        h('dl', { class: 'kv' }, Object.keys(l.fields).map(function (k) { return [h('dt', { text: k }), h('dd', { text: l.fields[k] })]; })),
        h('div', { class: 'row' }, h('label', { class: 'fld' }, h('span', { text: 'Status' }), sel)),
        h('label', { class: 'fld' }, h('span', { text: 'Note' }), note),
        h('div', { class: 'inline' },
          h('button', { class: 'btn primary', onclick: function () {
            api('PATCH', '/api/leads/' + l.id, { status: sel.value, note: note.value }).then(function (u) { Object.assign(l, u); toast('Enquiry updated.'); paint(); refreshBadge(); }).catch(function (e) { toast(e.message, true); });
          } }, 'Save'),
          h('span', { class: 'grow' }),
          h('button', { class: 'btn danger', onclick: function () {
            ask('Delete this enquiry permanently?', 'Delete', function () { api('DELETE', '/api/leads/' + l.id).then(function () { state.leads = state.leads.filter(function (x) { return x.id !== l.id; }); state.leadId = null; paint(); refreshBadge(); toast('Enquiry deleted.'); }).catch(function (e) { toast(e.message, true); }); });
          } }, 'Delete')),
        l.updatedBy ? h('p', { class: 'desc', style: 'margin-top:12px', text: 'Last updated ' + ago(l.updatedAt) + ' by ' + l.updatedBy }) : null
      );
    }
    api('GET', '/api/leads').then(function (d) { state.leads = d; paint(); }).catch(function (e) { put(list, h('p', { class: 'err-msg', text: e.message })); });
    return h('div', null,
      h('div', { class: 'filters' }, q, kind, st, h('span', { class: 'grow' }), window.RH_DEMO ? h('button', { class: 'btn sm', onclick: function () { toast('CSV export downloads a spreadsheet on the live site.'); } }, ic('file'), 'Export CSV') : h('a', { class: 'btn sm', href: API + 'leads.csv' }, ic('file'), 'Export CSV')),
      h('div', { class: 'leads' }, list, detail));
  }

  /* ---------- website preview ---------- */
  function previewView() {
    var pages = [['', 'Home'], ['about', 'About Us'], ['services', 'Services'], ['portfolio', 'Portfolio'], ['contact', 'Contact Us'], ['hire-staff', 'Hire Staff'], ['partner-with-us', 'Partner With Us']]
      .concat(state.content.services.map(function (x) { return ['service-' + x.id, 'Service · ' + x.name]; }));
    function url(k) { return window.RH_DEMO ? 'site.html' + (k ? '#' + k : '') : SITE + (k ? k + '.html' : '') + '?preview=' + Date.now(); }
    var frame = h('iframe', { class: 'pv-frame', title: 'Website preview', src: url('') });
    var sel = h('select', { style: 'width:auto', onchange: function () { frame.src = url(sel.value); } }, pages.map(function (x) { return h('option', { value: x[0], text: x[1] }); }));
    var wrap = h('div', { class: 'pv-wrap' }, frame);
    function size(w) { return h('button', { class: 'btn sm', type: 'button', onclick: function () { wrap.style.maxWidth = w; } }, w === '100%' ? 'Desktop' : 'Phone'); }
    return h('div', null,
      state.dirty ? h('div', { class: 'notice' }, ic('clock', 'ic'), h('p', { text: 'You have unsaved changes. Save to see them in the preview.' }), h('button', { class: 'btn primary', onclick: function () { save().then(function () { frame.src = url(sel.value); }, function () {}); } }, 'Save now')) : null,
      h('div', { class: 'filters' }, sel, size('100%'), size('390px'), h('button', { class: 'btn sm', type: 'button', onclick: function () { frame.src = url(sel.value); } }, 'Reload'), h('span', { class: 'grow' }),
        h('a', { class: 'btn sm', href: window.RH_DEMO ? 'site.html' : SITE, target: NEWTAB, rel: 'noopener' }, ic('globe'), 'Open full page')),
      wrap);
  }

  /* ---------- media ---------- */
  function mediaView() {
    var grid = h('div', { class: 'media-grid' });
    function load() {
      api('GET', '/api/uploads').then(function (list) {
        var used = JSON.stringify(state.content);
        put(grid, list.length ? list.map(function (f) {
          var inUse = used.indexOf(f.url) >= 0;
          return h('div', { class: 'media' }, h('div', { class: 'pic', style: 'background-image:url("' + src(f.url) + '")' }),
            h('div', { class: 'meta' }, h('b', { text: f.name }), h('br'), size(f.size) + (inUse ? ' · in use' : '')),
            h('div', { class: 'act' },
              h('button', { class: 'btn sm', onclick: function () { (navigator.clipboard ? navigator.clipboard.writeText(f.url) : Promise.reject()).then(function () { toast('Path copied: ' + f.url); }, function () { toast('Image path: ' + f.url); }); } }, 'Copy path'),
              h('button', { class: 'btn sm danger', disabled: inUse, title: inUse ? 'Used on the website' : 'Delete', onclick: function () {
                ask('Delete ' + f.name + '?', 'Delete', function () { api('DELETE', '/api/uploads/' + encodeURIComponent(f.name)).then(function () { toast('Deleted.'); load(); }).catch(function (e) { toast(e.message, true); }); });
              } }, 'Delete')));
        }) : [h('p', { class: 'empty', text: 'No images uploaded yet.' })]);
      }).catch(function (e) { toast(e.message, true); });
    }
    load();
    return h('div', null, h('p', { class: 'desc', text: 'Upload the logo and photos here, then choose them in Company details, Services or Portfolio.' }), uploader(load), grid);
  }

  /* ---------- versions & publish ---------- */
  function historyView() {
    var box = h('div');
    api('GET', '/api/history').then(function (list) {
      put(box, 
        h('div', { class: 'card' }, h('h2', { text: 'Website files' }),
          h('p', { class: 'desc', text: 'Every save writes the website straight from the database. If you upload new site files to the hosting later, the admin rewrites the content automatically the next time you open it. You can also do it now.' }),
          h('button', { class: 'btn', onclick: function (e) { var b = e.currentTarget; b.disabled = true; api('POST', '/api/publish', {}).then(function () { toast('Website files rewritten from the database.'); }).catch(function (er) { toast(er.message, true); }).finally(function () { b.disabled = false; }); } }, ic('send'), 'Re-publish website now')),
        h('div', { class: 'card' }, h('h2', { text: 'Previous versions' }), h('p', { class: 'desc', text: 'A copy is kept in the database every time content is saved (last 100). Restoring makes that version the current content.' }),
          list.length ? h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('tbody', null, list.map(function (v) {
            var d = v.at || v.id;
            return h('tr', null, h('td', null, h('b', { text: fmtDate(d) })), h('td', { text: v.by || '' }), h('td', { text: size(v.size) }), h('td', { style: 'text-align:right' }, h('button', { class: 'btn sm', onclick: function () {
              ask('Restore the version from ' + fmtDate(d) + '?' + (state.dirty ? ' Your unsaved changes will be lost.' : '') + ' The current content is kept as a version too.', 'Restore', function () { api('POST', '/api/history/' + v.id, {}).then(function (res) { state.content = res.content; state.draft = clone(res.content); state.meta = res.meta; state.dirty = false; updateState(); toast('Version restored — the website is updated.'); route(); }).catch(function (e) { toast(e.message, true); }); });
            } }, 'Restore')));
          })))) : h('p', { class: 'empty', text: 'No previous versions yet.' })));
    }).catch(function (e) { put(box, h('p', { class: 'err-msg', text: e.message })); });
    return box;
  }

  /* ---------- users ---------- */
  function usersView() {
    var box = h('div');
    function load() {
      api('GET', '/api/users').then(function (list) {
        var f = h('form', { class: 'card', novalidate: true }, h('h2', { text: 'Add a user' }), h('p', { class: 'desc', text: 'Editors can change content and handle leads. Owners can also manage users.' }),
          h('div', { class: 'row' },
            h('label', { class: 'fld' }, h('span', { text: 'Name' }), h('input', { name: 'name' })),
            h('label', { class: 'fld' }, h('span', { text: 'Email' }), h('input', { name: 'email', type: 'email', autocomplete: 'off' })),
            h('label', { class: 'fld' }, h('span', { text: 'Password' }), h('input', { name: 'password', type: 'password', autocomplete: 'new-password' }), h('em', { text: 'At least 10 characters. Share it privately.' })),
            h('label', { class: 'fld' }, h('span', { text: 'Role' }), h('select', { name: 'role' }, h('option', { value: 'editor', text: 'Editor' }), h('option', { value: 'owner', text: 'Owner' })))),
          h('button', { class: 'btn primary', type: 'submit' }, 'Add user'));
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          api('POST', '/api/users', { name: f.name.value, email: f.email.value, password: f.password.value, role: f.role.value }).then(function () { toast('User added.'); load(); }).catch(function (er) { toast(er.message, true); });
        });
        put(box, h('div', { class: 'card' }, h('h2', { text: 'Users' }), h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' },
          h('thead', null, h('tr', null, h('th', { text: 'Name' }), h('th', { text: 'Email' }), h('th', { text: 'Role' }), h('th', { text: 'Two-step' }), h('th', { text: 'Last sign-in' }), h('th'))),
          h('tbody', null, list.map(function (u) {
            return h('tr', null, h('td', null, h('b', { text: u.name || '—' })), h('td', { text: u.email }), h('td', null, h('span', { class: 'pill ' + u.role, text: u.role })), h('td', null, h('span', { class: 'pill ' + (u.twoFactor ? 'done' : ''), text: u.twoFactor ? 'On' : 'Off' })), h('td', { text: u.lastLogin ? ago(u.lastLogin) : 'never' }),
              h('td', { style: 'text-align:right;white-space:nowrap' }, u.id === state.user.id ? h('small', { text: 'you' }) : [
                u.twoFactor ? h('button', { class: 'btn sm', style: 'margin-right:6px', onclick: function () {
                  ask('Turn off two-step verification for ' + u.email + '? Use this when they lost their phone. They will be signed out.', 'Turn off', function () { api('POST', '/api/users/' + u.id + '/reset-2fa', {}).then(function () { toast('Two-step verification turned off.'); load(); }).catch(function (e) { toast(e.message, true); }); });
                } }, 'Reset 2FA') : null,
                h('button', { class: 'btn sm danger', onclick: function () {
                  ask('Remove ' + u.email + '? They will be signed out.', 'Remove', function () { api('DELETE', '/api/users/' + u.id).then(function () { toast('User removed.'); load(); }).catch(function (e) { toast(e.message, true); }); });
                } }, 'Remove')]));
          }))))), f);
      }).catch(function (e) { put(box, h('p', { class: 'err-msg', text: e.message })); });
    }
    load();
    return box;
  }

  /* ---------- account ---------- */
  function accountView() {
    var f = h('form', { class: 'card', novalidate: true, style: 'max-width:620px' }, h('h2', { text: 'Change password' }),
      h('p', { class: 'desc', text: 'Signed in as ' + state.user.email + '. Changing the password signs out your other devices.' }),
      h('label', { class: 'fld' }, h('span', { text: 'Current password' }), h('input', { name: 'current', type: 'password', autocomplete: 'current-password' })),
      h('label', { class: 'fld' }, h('span', { text: 'New password' }), h('input', { name: 'password', type: 'password', autocomplete: 'new-password' }), h('em', { text: 'At least 10 characters.' })),
      h('label', { class: 'fld' }, h('span', { text: 'Repeat new password' }), h('input', { name: 'again', type: 'password', autocomplete: 'new-password' })),
      h('button', { class: 'btn primary', type: 'submit' }, 'Update password'));
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.password.value !== f.again.value) return toast('The new passwords do not match.', true);
      api('POST', '/api/auth/password', { current: f.current.value, password: f.password.value }).then(function () { f.reset(); toast('Password updated.'); }).catch(function (er) { toast(er.message, true); });
    });
    return h('div', null, twoFactorCard(), f);
  }
  function twoFactorCard() {
    var card = h('div', { class: 'card', style: 'max-width:620px' });
    function paint() {
      if (state.user.twoFactor) {
        var pw = h('input', { type: 'password', autocomplete: 'current-password' });
        put(card, h('h2', null, 'Two-step verification ', h('span', { class: 'pill done', text: 'On' })),
          h('p', { class: 'desc', text: 'Signing in needs your password and a code from your authenticator app.' }),
          h('label', { class: 'fld', style: 'max-width:320px' }, h('span', { text: 'Password (to turn it off)' }), pw),
          h('button', { class: 'btn danger', onclick: function () {
            api('POST', '/api/auth/2fa/disable', { password: pw.value }).then(function () { state.user.twoFactor = false; toast('Two-step verification is off.'); paint(); }).catch(function (e) { toast(e.message, true); });
          } }, 'Turn off'));
      } else {
        put(card, h('h2', null, 'Two-step verification ', h('span', { class: 'pill', text: 'Off' })),
          h('p', { class: 'desc', text: 'Protect the admin even if someone learns your password: signing in will also need a 6-digit code from an app on your phone (Google Authenticator, Microsoft Authenticator or Authy).' }),
          h('button', { class: 'btn primary', onclick: function () {
            api('POST', '/api/auth/2fa/start', {}).then(function (d) {
              var code = h('input', { inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: 8, placeholder: '123 456', style: 'max-width:180px' });
              put(card, h('h2', { text: 'Set up two-step verification' }),
                h('ol', { class: 'steps' },
                  h('li', { text: 'Install Google Authenticator, Microsoft Authenticator or Authy on your phone.' }),
                  h('li', null, 'In the app choose ', h('b', { text: 'Add account → Enter a setup key' }), ' and type this key (type: time based):'),
                  h('li', { style: 'list-style:none;margin-left:-20px' }, h('div', { class: 'secret', text: d.secret.replace(/(.{4})/g, '$1 ').trim() })),
                  h('li', null, 'On the phone itself you can also ', h('a', { href: d.uri, text: 'tap here to add it' }), '.'),
                  h('li', { text: 'Enter the 6-digit code the app shows:' })),
                h('div', { class: 'inline' }, code, h('button', { class: 'btn primary', onclick: function () {
                  api('POST', '/api/auth/2fa/enable', { code: code.value }).then(function () { state.user.twoFactor = true; toast('Two-step verification is on.'); paint(); }).catch(function (e) { toast(e.message, true); });
                } }, 'Turn on'), h('button', { class: 'btn ghost', onclick: paint }, 'Cancel')));
              code.focus();
            }).catch(function (e) { toast(e.message, true); });
          } }, 'Set up'));
      }
    }
    paint();
    return card;
  }

  /* ---------- activity log (owner) ---------- */
  var ACTIONS = { 'content.save': 'Content saved', 'site.republish': 'Website re-published', login: 'Signed in', 'login.failed': 'Failed sign-in', 'password.change': 'Password changed',
    '2fa.enable': 'Two-step turned on', '2fa.disable': 'Two-step turned off', '2fa.reset': 'Two-step reset', 'lead.delete': 'Enquiry deleted', 'lead.status': 'Enquiry status',
    'leads.export': 'Leads exported', 'image.upload': 'Image uploaded', 'image.delete': 'Image deleted', 'user.add': 'User added', 'user.remove': 'User removed', 'settings.save': 'Settings saved', setup: 'Installed' };
  function activityView() {
    var box = h('div', null, h('p', { class: 'empty', text: 'Loading…' }));
    api('GET', '/api/activity').then(function (list) {
      put(box, h('p', { class: 'desc', text: 'Who did what in the admin panel (last 300 events). Failed sign-ins are shown in red.' }),
        h('div', { class: 'card' }, list.length ? h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' },
          h('thead', null, h('tr', null, h('th', { text: 'When' }), h('th', { text: 'Who' }), h('th', { text: 'What' }), h('th', { text: 'Details' }), h('th', { text: 'IP' }))),
          h('tbody', null, list.map(function (a) {
            return h('tr', { style: a.action === 'login.failed' ? 'color:#ff9aa2' : null }, h('td', { text: ago(a.at), title: fmtDate(a.at) }), h('td', { text: a.who }), h('td', null, h('b', { text: ACTIONS[a.action] || a.action })), h('td', { text: a.detail }), h('td', { text: a.ip }));
          })))) : h('p', { class: 'empty', text: 'No activity yet.' })));
    }).catch(function (e) { put(box, h('p', { class: 'err-msg', text: e.message })); });
    return box;
  }

  /* ---------- settings (owner) ---------- */
  function settingsView() {
    var f = h('form', { class: 'card', novalidate: true, style: 'max-width:620px' }, h('h2', { text: 'Lead alerts' }),
      h('p', { class: 'desc', text: 'Send an email for every new enquiry from the website. Leave empty to turn alerts off.' }),
      h('label', { class: 'fld' }, h('span', { text: 'Send alerts to' }), h('input', { name: 'notifyEmail', type: 'email', placeholder: 'info@rhmanagements.com' })),
      h('button', { class: 'btn primary', type: 'submit' }, 'Save settings'));
    api('GET', '/api/settings').then(function (s) { f.notifyEmail.value = s.notifyEmail || ''; }).catch(function () {});
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      api('PUT', '/api/settings', { notifyEmail: f.notifyEmail.value.trim() }).then(function () { toast('Settings saved.'); }).catch(function (er) { toast(er.message, true); });
    });
    return f;
  }

  /* ---------- keyboard: Ctrl/Cmd+S saves ---------- */
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && state.user) { e.preventDefault(); if (state.dirty) save(); }
  });

  /* ---------- boot ---------- */
  api('GET', '/api/auth/me').then(function (d) { state.user = d.user; start(); }).catch(function () { renderAuth(); });
})();
