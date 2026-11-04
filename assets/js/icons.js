/* Line icons (24×24, stroke) and simplified flag drawings */
(function () {
  var P = {
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    trending: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    idcard: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2M15 12h2M6 16h12"/>',
    hardhat: '<path d="M2 18h20"/><path d="M4 18v-2a8 8 0 0 1 16 0v2"/><path d="M10 9V5h4v4"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    passport: '<rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8 17h8"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    wallet: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
    cap: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
    ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
    bank: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l8 5H4z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    truck: '<path d="M10 17h4V5H2v12h3M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'
  };

  window.icon = function (name, cls) {
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || P.star) + '</svg>';
  };

  /* Simplified flags: [orientation, stripes..., "*" disc colour, "|" hoist band colour] */
  var FL = {
    eg: ['h', '#ce1126', '#fff', '#000'], et: ['h', '#078930', '#fcdd09', '#da121a'], ke: ['h', '#000', '#bb0000', '#006600'],
    gh: ['h', '#ce1126', '#fcd116', '#006b3f'], sn: ['v', '#00853f', '#fdef42', '#e31b23'], cm: ['v', '#007a5e', '#ce1126', '#fcd116'],
    ma: ['h', '#c1272d', '*#006233'], sl: ['h', '#1eb53a', '#fff', '#0072c6'], rw: ['h', '#00a1de', '#00a1de', '#fad201', '#20603d'],
    ml: ['v', '#14b53a', '#fcd116', '#ce1126'], gn: ['v', '#ce1126', '#fcd116', '#009460'],
    in: ['h', '#ff9933', '#fff', '#138808', '*#000080'], pk: ['h', '#01411c', '|#fff'], bd: ['h', '#006a4e', '*#f42a41'],
    np: ['h', '#dc143c', '*#fff'], lk: ['v', '#ffbe29', '#00534e', '#8d153a'], id: ['h', '#e70011', '#fff'], ph: ['h', '#0038a8', '#ce1126', '*#fcd116'],
    ae: ['h', '#00732f', '#fff', '#000', '|#ff0000'], sa: ['h', '#006c35', '*#fff'],
    us: ['h', '#b22234', '#fff', '#b22234', '#fff', '#b22234', '#fff', '#b22234', '|#3c3b6e'], eu: ['h', '#003399', '*#ffcc00'],
    cn: ['h', '#de2910', '*#ffde00'], az: ['h', '#00b5e2', '#ef3340', '#509e2f'], kz: ['h', '#00afca', '*#fec50c'],
    th: ['h', '#a51931', '#f4f5f8', '#2d2a4a', '#2d2a4a', '#f4f5f8', '#a51931'],
    my: ['h', '#cc0001', '#fff', '#cc0001', '#fff', '#cc0001', '#fff', '#cc0001', '|#010066'], sg: ['h', '#ef3340', '#fff'],
    tr: ['h', '#e30a17', '*#fff'], mv: ['h', '#d21034', '*#007e3a'], ge: ['h', '#fff', '*#ff0000'], uz: ['h', '#0099b5', '#fff', '#1eb53a'],
    vn: ['h', '#da251d', '*#ffff00'], jp: ['h', '#fff', '*#bc002d'], fr: ['v', '#0055a4', '#fff', '#ef4135'], it: ['v', '#009246', '#fff', '#ce2b37'],
    es: ['h', '#aa151b', '#f1bf00', '#f1bf00', '#aa151b'], de: ['h', '#000', '#dd0000', '#ffce00'],
    gr: ['h', '#0d5eaf', '#fff', '#0d5eaf', '#fff', '#0d5eaf', '#fff', '#0d5eaf', '#fff', '#0d5eaf', '|#0d5eaf'],
    nl: ['h', '#ae1c28', '#fff', '#21468b'], at: ['h', '#ed2939', '#fff', '#ed2939'], ch: ['h', '#da291c', '*#fff'], ca: ['v', '#ff0000', '#fff', '#ff0000']
  };

  function parts(code) {
    var a = FL[code] || ['h', '#888', '#ccc'];
    return {
      v: a[0] === 'v',
      s: a.slice(1).filter(function (c) { return c[0] !== '*' && c[0] !== '|'; }),
      d: (a.filter(function (c) { return c[0] === '*'; })[0] || '').slice(1),
      b: (a.filter(function (c) { return c[0] === '|'; })[0] || '').slice(1)
    };
  }

  window.flagParts = parts;
  window.flagShapes = function (code, x, y, w, h) {
    var f = parts(code), n = f.s.length, o = '<g>';
    f.s.forEach(function (c, i) {
      o += f.v
        ? '<rect x="' + (x + w * i / n) + '" y="' + y + '" width="' + (w / n + .3) + '" height="' + h + '" fill="' + c + '"/>'
        : '<rect x="' + x + '" y="' + (y + h * i / n) + '" width="' + w + '" height="' + (h / n + .3) + '" fill="' + c + '"/>';
    });
    if (f.b) o += '<rect x="' + x + '" y="' + y + '" width="' + w * .3 + '" height="' + h + '" fill="' + f.b + '"/>';
    if (f.d) o += '<circle cx="' + (x + w * (f.b ? .65 : .5)) + '" cy="' + (y + h / 2) + '" r="' + h * .2 + '" fill="' + f.d + '"/>';
    if (code === 'pk') {
      var cx = x + w * .65, cy = y + h / 2;
      o += '<circle cx="' + cx + '" cy="' + cy + '" r="' + h * .3 + '" fill="#fff"/><circle cx="' + (cx + h * .11) + '" cy="' + cy + '" r="' + h * .26 + '" fill="#01411c"/>';
    }
    return o + '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1.5" fill="none" stroke="rgba(0,0,0,.12)"/></g>';
  };

  window.flag = function (code) {
    return '<svg class="flag" viewBox="0 0 24 16" width="24" height="16" aria-hidden="true">' + window.flagShapes(code, 0, 0, 24, 16) + '</svg>';
  };
})();
