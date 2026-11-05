/* In-browser stand-in for admin/api.php, used only by the shareable demo
 * (admin/demo/build-demo.py). Data is kept in this browser's localStorage. */
(function () {
  'use strict';
  var mem = {};
  function get(k, d) { try { var v = localStorage.getItem('rh-demo-' + k); return v ? JSON.parse(v) : d; } catch (e) { return k in mem ? mem[k] : d; } }
  function set(k, v) { mem[k] = v; try { localStorage.setItem('rh-demo-' + k, JSON.stringify(v)); } catch (e) {} }
  function id() { return Math.random().toString(16).slice(2, 10) + Date.now().toString(16).slice(-6); }
  var now = Date.now(), iso = function (ms) { return new Date(ms).toISOString(); };
  var seed = window.RH_SEED_CONTENT;
  if (!get('content')) set('content', seed);
  if (!get('users')) set('users', [{ id: 'owner1', email: 'owner@example.com', name: 'Demo Owner', role: 'owner', createdAt: iso(now - 864e5 * 9), lastLogin: iso(now) }]);
  if (!get('leads')) set('leads', [
    { id: id(), kind: 'company', status: 'new', createdAt: iso(now - 36e5 * 2), page: '/hire-staff.html', name: 'Example: Ahmed Khan', email: 'ahmed@example.com', phone: '+971 50 000 0000', company: 'Example Builders LLC', note: '',
      fields: { 'Company name': 'Example Builders LLC', 'Contact person': 'Example: Ahmed Khan', Email: 'ahmed@example.com', Phone: '+971 50 000 0000', 'Roles or job titles needed': 'Masons, electricians, helpers', 'Number of workers': '40', 'Hiring from': 'Outside the UAE', Message: 'Need the team on site by next month.' } },
    { id: id(), kind: 'agent', status: 'contacted', createdAt: iso(now - 864e5 * 1.5), page: '/partner-with-us.html', name: 'Example: Grace Mwangi', email: 'grace@example.com', phone: '+254 700 000 000', company: 'Example Recruiters Kenya', note: 'Sent partnership terms.',
      fields: { 'Agency or company name': 'Example Recruiters Kenya', Country: 'Kenya', 'Contact person': 'Example: Grace Mwangi', Email: 'grace@example.com', Phone: '+254 700 000 000', Candidates: 'Both skilled and unskilled', 'Number of candidates you can supply': '200 per month' } },
    { id: id(), kind: 'general', status: 'done', createdAt: iso(now - 864e5 * 4), page: '/contact.html', name: 'Example: Sara Ali', email: 'sara@example.com', phone: '', company: '', note: '',
      fields: { Name: 'Example: Sara Ali', Email: 'sara@example.com', Service: 'Travel & Tour', Message: 'Visit visa for Georgia for two people in December?' } }
  ]);

  function log(action, detail) { var a = get('activity', []); a.unshift({ at: iso(Date.now()), who: (get('users')[0] || {}).email, action: action, detail: detail, ip: 'demo' }); set('activity', a.slice(0, 300)); }
  if (!get('activity')) set('activity', [{ at: iso(now - 864e5), who: 'owner@example.com', action: 'setup', detail: 'Database installed and owner account created', ip: 'demo' }]);
  function plain(o) { return JSON.parse(JSON.stringify(o)); }
  function reply(status, body) { return Promise.resolve(new Response(JSON.stringify(body), { status: status, headers: { 'Content-Type': 'application/json' } })); }
  function err(status, msg) { return reply(status, { error: msg }); }
  var KINDS = ['general', 'company', 'agent'];

  var real = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (url, opt) {
    var m = String(url).match(/^(?:\.\.\/)?(?:demo-)?api\/(.*)$/);
    if (!m) return real(url, opt);
    opt = opt || {};
    var method = (opt.headers && opt.headers['X-Method']) || opt.method || 'GET';
    var body = {}; try { body = opt.body ? JSON.parse(opt.body) : {}; } catch (e) {}
    var r = m[1], p = r.split('/'), route = method + ' ' + r;
    var me = get('signedOut') ? null : get('users')[0];

    if (route === 'GET content') return reply(200, get('content'));
    if (route === 'POST leads') {
      if (body.website) return reply(201, { ok: true });
      var f = body.fields || {};
      var lead = { id: id(), kind: KINDS.indexOf(body.kind) >= 0 ? body.kind : 'general', status: 'new', createdAt: iso(Date.now()), page: body.page || '', note: '',
        name: f.Name || f['Contact person'] || '', email: f.Email || '', phone: f.Phone || '', company: f['Company name'] || f['Agency or company name'] || '', fields: f };
      var ls = get('leads'); ls.unshift(lead); set('leads', ls);
      return reply(201, { ok: true, id: lead.id });
    }
    if (route === 'GET auth/setup') return reply(200, { needsSetup: false });
    if (route === 'POST auth/login') {
      if (!body.email || !body.password) return err(401, 'Enter any email and password to sign in to the demo.');
      set('signedOut', false); return reply(200, { user: get('users')[0] });
    }
    if (!me) return err(401, 'Please sign in.');
    if (route === 'GET auth/me') return reply(200, { user: me });
    if (route === 'POST auth/logout') { set('signedOut', true); return reply(200, { ok: true }); }
    if (route === 'POST auth/2fa/start') return reply(200, { secret: 'DEMOKEY234567ABCDEFGHIJKLMNOPQRS', uri: 'otpauth://totp/RH%20Admin%20(demo)?secret=DEMOKEY234567ABCDEFGHIJKLMNOPQRS' });
    if (route === 'POST auth/2fa/enable') { if (!/^\d{6}$/.test(String(body.code || '').replace(/\s/g, ''))) return err(400, 'Enter the 6-digit code. In the demo any 6 digits work.'); var u1 = get('users'); u1[0].twoFactor = true; set('users', u1); log('2fa.enable', ''); return reply(200, { ok: true }); }
    if (route === 'POST auth/2fa/disable') { var u2 = get('users'); u2[0].twoFactor = false; set('users', u2); log('2fa.disable', ''); return reply(200, { ok: true }); }
    if (route === 'POST publish') { log('site.republish', 'Website files rewritten from the database'); return reply(200, { ok: true }); }
    if (route === 'GET activity') return reply(200, get('activity', []));
    if (route === 'GET settings') return reply(200, get('settings', {}));
    if (route === 'PUT settings') { if (body.notifyEmail && !/^\S+@\S+\.\S+$/.test(body.notifyEmail)) return err(400, 'Enter a valid email address for notifications, or leave it empty.'); set('settings', { notifyEmail: body.notifyEmail || '' }); log('settings.save', body.notifyEmail ? 'Lead alerts to ' + body.notifyEmail : 'Lead alerts off'); return reply(200, { ok: true }); }
    if (method === 'POST' && p[0] === 'users' && p[2] === 'reset-2fa') { var u3 = get('users'); u3.forEach(function (x) { if (x.id === p[1]) x.twoFactor = false; }); set('users', u3); return reply(200, { ok: true }); }
    if (route === 'POST auth/password') return (body.password || '').length < 10 ? err(400, 'Password must be at least 10 characters.') : reply(200, { ok: true });

    if (route === 'GET content/meta') return reply(200, get('meta', {}));
    if (route === 'PUT content') {
      var meta = get('meta', {});
      if (meta.version && body.base !== meta.version && !body.force) return err(409, 'Someone else saved changes after you opened the editor.');
      var hist = get('history', []); hist.unshift({ id: iso(Date.now()).replace(/[:.]/g, '-'), at: iso(Date.now()), by: me.email, content: get('content') }); set('history', hist.slice(0, 20));
      log('content.save', 'Content saved');
      set('content', body.content);
      meta = { savedAt: iso(Date.now()), savedBy: me.email, version: id() }; set('meta', meta);
      return reply(200, { ok: true, meta: meta });
    }
    if (route === 'GET history') return reply(200, get('history', []).map(function (h) { return { id: h.id, at: h.at, by: h.by, size: JSON.stringify(h.content).length }; }));
    if (method === 'POST' && p[0] === 'history') {
      var v = get('history', []).filter(function (h) { return h.id === p[1]; })[0];
      if (!v) return err(404, 'Version not found.');
      set('content', v.content); var mt = { savedAt: iso(Date.now()), savedBy: me.email, version: id() }; set('meta', mt);
      return reply(200, { ok: true, content: v.content, meta: mt });
    }
    if (route === 'GET dashboard') {
      var L = get('leads'), c = get('content'), by = {};
      KINDS.forEach(function (k) { by[k] = L.filter(function (l) { return l.kind === k; }).length; });
      return reply(200, { leads: { total: L.length, new: L.filter(function (l) { return l.status === 'new'; }).length, week: L.filter(function (l) { return Date.now() - Date.parse(l.createdAt) < 6048e5; }).length, byKind: by },
        recent: L.slice(0, 6), meta: get('meta', {}),
        content: { services: c.services.length, projects: c.projects.length, countries: c.sourcing.africa.length + c.sourcing.asia.length, destinations: c.destinations.asia.length + c.destinations.world.length, uploads: get('uploads', []).length } });
    }
    if (route === 'GET leads') return reply(200, get('leads'));
    if (p[0] === 'leads' && p[1]) {
      var list = get('leads'), i = list.findIndex(function (l) { return l.id === p[1]; });
      if (i < 0) return err(404, 'Enquiry not found.');
      if (method === 'DELETE') { list.splice(i, 1); set('leads', list); return reply(200, { ok: true }); }
      if (body.status) list[i].status = body.status;
      if (typeof body.note === 'string') list[i].note = body.note;
      list[i].updatedAt = iso(Date.now()); list[i].updatedBy = me.email; set('leads', list);
      return reply(200, plain(list[i]));
    }
    if (route === 'GET uploads') return reply(200, get('uploads', []));
    if (route === 'POST uploads') {
      if (!/^image\/(png|jpeg|webp|gif)$/.test(body.type || '')) return err(400, 'Upload a PNG, JPG, WebP or GIF image.');
      var name = String(body.name || 'image').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '-' + id().slice(0, 6);
      var up = { name: name, url: 'data:' + body.type + ';base64,' + body.data, size: Math.round(String(body.data).length * 0.75), uploadedAt: iso(Date.now()) };
      var ups = get('uploads', []); ups.unshift(up); set('uploads', ups);
      return reply(201, up);
    }
    if (method === 'DELETE' && p[0] === 'uploads') {
      var all = get('uploads', []), u = all.filter(function (x) { return x.name === decodeURIComponent(p[1]); })[0];
      if (u && JSON.stringify(get('content')).indexOf(u.url) >= 0) return err(409, 'This image is used on the website. Remove it from the content first.');
      set('uploads', all.filter(function (x) { return x !== u; })); return reply(200, { ok: true });
    }
    if (route === 'GET users') return reply(200, get('users'));
    if (route === 'POST users') {
      if (!/^\S+@\S+\.\S+$/.test(body.email || '')) return err(400, 'Enter a valid email.');
      if ((body.password || '').length < 10) return err(400, 'Password must be at least 10 characters.');
      var us = get('users'); if (us.some(function (x) { return x.email === body.email.toLowerCase(); })) return err(409, 'A user with this email already exists.');
      us.push({ id: id(), email: body.email.toLowerCase(), name: body.name || '', role: body.role === 'owner' ? 'owner' : 'editor', createdAt: iso(Date.now()) }); set('users', us);
      return reply(201, { ok: true });
    }
    if (method === 'DELETE' && p[0] === 'users') { set('users', get('users').filter(function (x) { return x.id !== p[1]; })); return reply(200, { ok: true }); }
    return err(404, 'Not found.');
  };
  window.RH_DEMO_RESET = function () { ['content', 'users', 'leads', 'meta', 'history', 'uploads', 'signedOut', 'activity', 'settings'].forEach(function (k) { delete mem[k]; try { localStorage.removeItem('rh-demo-' + k); } catch (e) {} }); location.reload(); };
})();
