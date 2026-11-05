<?php
/*
 * RH Business Solutions — back end API (PHP 8.1+, MySQL/MariaDB via PDO, no Composer).
 * Runs on Hostinger shared hosting (Apache/LiteSpeed + .htaccess) and locally with
 *   php -S localhost:8000 admin/router.php
 *
 * The root .htaccess rewrites /api/<route> to admin/api.php?r=<route>.
 *   public     GET content · POST leads · GET|POST auth/setup · POST auth/login
 *   signed in  GET auth/me · POST auth/logout · POST auth/password · POST auth/2fa/{start,enable,disable}
 *              GET dashboard · GET|PUT content · GET content/meta · POST publish
 *              GET history · POST history/<id> · GET leads · GET leads.csv · PATCH|DELETE leads/<id>
 *              GET|POST uploads · DELETE uploads/<name>
 *   owner      GET|POST users · DELETE users/<id> · POST users/<id>/reset-2fa · GET activity · GET|PUT settings
 *
 * The database is the source of truth (content, versions, leads, users, activity).
 * Every save also publishes the website files: assets/js/content.js, service-<id>.html
 * pages, sitemap.xml and a ?v= cache-buster in every page — so changes are live at once.
 */
declare(strict_types=1);

const SESSION_HOURS = 12;
const HISTORY_KEEP = 100;
const KINDS = ['general' => 'Contact form', 'company' => 'Hire staff request', 'agent' => 'Partner request'];
const STATUSES = ['new', 'contacted', 'done', 'archived'];
const IMAGE_TYPES = ['image/png' => 'png', 'image/jpeg' => 'jpg', 'image/webp' => 'webp', 'image/gif' => 'gif'];

$ROOT = dirname(__DIR__);
$DATA = getenv('RH_DATA_DIR') ?: __DIR__ . '/data';
$CONTENT_JS = $ROOT . '/assets/js/content.js';
$UPLOADS = $ROOT . '/assets/uploads';
$ME = null;
foreach ([$DATA, $UPLOADS] as $d) if (!is_dir($d)) @mkdir($d, 0755, true);
if (!file_exists("$DATA/.htaccess")) @file_put_contents("$DATA/.htaccess", "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Deny from all\n</IfModule>\n");
if (!file_exists("$DATA/index.html")) @file_put_contents("$DATA/index.html", '');

require __DIR__ . '/lib/core.php';
require __DIR__ . '/lib/content.php';
require __DIR__ . '/lib/db.php';

/* ---------- sessions ---------- */
function start_session(): void {
  session_name('rh_admin');
  session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => https(), 'httponly' => true, 'samesite' => 'Strict']);
  ini_set('session.use_strict_mode', '1');
  ini_set('session.gc_maxlifetime', (string)(SESSION_HOURS * 3600));
  session_start();
}
function sign_in(array $u): void {
  session_regenerate_id(true);
  $_SESSION = ['uid' => $u['id'], 'pwv' => (int)$u['pwv'], 'at' => time()];
}
function current_user(): ?array {
  if (empty($_SESSION['uid']) || time() - ($_SESSION['at'] ?? 0) > SESSION_HOURS * 3600) return null;
  $u = row('SELECT * FROM rh_users WHERE id = ?', [$_SESSION['uid']]);
  return $u && (int)$u['pwv'] === (int)($_SESSION['pwv'] ?? 0) ? $u : null;
}
function pw_problem($pw): string { return !is_string($pw) || strlen($pw) < 10 ? 'Password must be at least 10 characters.' : (strlen($pw) > 200 ? 'Password is too long.' : ''); }
function valid_email($e): bool { return is_string($e) && (bool)filter_var($e, FILTER_VALIDATE_EMAIL); }

/* ---------- content ---------- */
function content(): array { return setting('content') ?? read_content_file(); }
function meta(): array { return setting('meta', []) ?: []; }
function save_content(array $next, string $label): array {
  global $ME;
  $prev = setting('content');
  if ($prev !== null) q('INSERT INTO rh_versions (id, created_at, created_by, data) VALUES (?, ?, ?, ?)', [gmdate('Y-m-d\TH-i-s') . '-' . substr(uid(), 0, 6), now_iso(), $ME['email'] ?? '', j($prev)]);
  $old = rows('SELECT id FROM rh_versions ORDER BY id DESC LIMIT 1000 OFFSET ' . HISTORY_KEEP);
  foreach ($old as $o) q('DELETE FROM rh_versions WHERE id = ?', [$o['id']]);
  $meta = ['savedAt' => now_iso(), 'savedBy' => $ME['email'] ?? '', 'version' => bin2hex(random_bytes(6))];
  set_setting('content', $next);
  set_setting('meta', $meta);
  set_setting('content_hash', publish_files($next, $meta['version']));
  activity('content.save', $label);
  return $meta;
}
/**
 * If assets/js/content.js no longer matches the database (for example after new site
 * files were uploaded), write the website files again from the database.
 */
function ensure_published(): bool {
  global $CONTENT_JS;
  $c = setting('content');
  if ($c === null) return false;
  if (is_file($CONTENT_JS) && sha1_file($CONTENT_JS) === setting('content_hash')) return false;
  set_setting('content_hash', publish_files($c, meta()['version'] ?? substr(uid(), 0, 12)));
  activity('site.republish', 'Website files rewritten from the database', 'system');
  return true;
}
/** Short description of what changed between two content versions (for the activity log). */
function diff_label(?array $a, array $b): string {
  if (!$a) return 'Content saved';
  $names = ['company' => 'Company details', 'nav' => 'Menu', 'hero' => 'Home hero', 'stats' => 'Stats', 'services' => 'Services', 'recruitmentItems' => 'Recruitment items',
    'process' => 'Work process', 'hiringSteps' => 'Hiring steps', 'projects' => 'Portfolio', 'sourcing' => 'Sourcing countries', 'emirates' => 'Emirates', 'destinations' => 'Travel destinations'];
  $ch = [];
  foreach ($b as $k => $v) if (j($a[$k] ?? null) !== j($v)) $ch[] = $names[$k] ?? $k;
  return $ch ? 'Changed: ' . implode(', ', $ch) : 'Saved without changes';
}

/* ---------- leads ---------- */
function clean_lead(array $b): array {
  if (!is_array($b['fields'] ?? null)) fail(400, 'Missing form fields.');
  $f = [];
  foreach (array_slice($b['fields'], 0, 30, true) as $k => $v) {
    if (!is_string($v) || trim($v) === '') continue;
    $f[mb_substr((string)$k, 0, 80)] = mb_substr(trim($v), 0, 4000);
  }
  if (!$f) fail(400, 'The form is empty.');
  $email = $f['Email'] ?? $f['Email address'] ?? '';
  if ($email !== '' && !valid_email($email)) fail(400, 'Please enter a valid email address.');
  return ['id' => uid(), 'kind' => isset(KINDS[$b['kind'] ?? '']) ? $b['kind'] : 'general', 'status' => 'new', 'createdAt' => now_iso(),
    'page' => mb_substr((string)($b['page'] ?? ''), 0, 200),
    'name' => $f['Name'] ?? $f['Your name'] ?? $f['Contact person'] ?? '', 'email' => $email, 'phone' => $f['Phone'] ?? $f['Phone (optional)'] ?? '',
    'company' => $f['Company name'] ?? $f['Agency or company name'] ?? '', 'fields' => $f, 'note' => '',
    'ip' => client_ip(), 'userAgent' => mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 300)];
}
function notify_owner(array $lead): void {
  $to = (string)(setting('settings', [])['notifyEmail'] ?? '');
  if (!valid_email($to)) return;
  $lines = []; foreach ($lead['fields'] as $k => $v) $lines[] = "$k: $v";
  $host = preg_replace('/[^A-Za-z0-9.-]/', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost'));
  $headers = "From: Website <no-reply@$host>\r\nContent-Type: text/plain; charset=utf-8";
  if (valid_email($lead['email'])) $headers .= "\r\nReply-To: " . $lead['email'];
  @mail($to, '=?UTF-8?B?' . base64_encode('New ' . KINDS[$lead['kind']] . ' — ' . ($lead['name'] ?: $lead['email'])) . '?=', implode("\n", $lines) . "\n\nOpen the leads inbox: https://$host/admin/#leads", $headers);
}
function csv_cell($v): string {
  $s = (string)$v;
  // Stop spreadsheet formula injection, but leave plain numbers like +971 50 123 4567 alone.
  if (preg_match('/^[=@\t\r]/', $s) || (preg_match('/^[+\-]/', $s) && !preg_match('/^[+\-][\d\s().\-]*$/', $s))) $s = "'" . $s;
  return '"' . str_replace('"', '""', $s) . '"';
}
function list_uploads(): array {
  global $UPLOADS;
  $out = [];
  foreach (glob("$UPLOADS/*.{png,jpg,jpeg,webp,gif}", GLOB_BRACE) ?: [] as $f)
    $out[] = ['name' => basename($f), 'url' => 'assets/uploads/' . basename($f), 'size' => filesize($f), 'uploadedAt' => gmdate('c', filemtime($f))];
  usort($out, fn($a, $b) => strcmp($b['uploadedAt'], $a['uploadedAt']));
  return $out;
}

/* ---------- router ---------- */
try {
  $method = $_SERVER['REQUEST_METHOD'];
  if ($method === 'POST' && !empty($_SERVER['HTTP_X_METHOD'])) $method = strtoupper((string)$_SERVER['HTTP_X_METHOD']); // hosts that block PUT/DELETE
  $r = trim((string)($_GET['r'] ?? ''), '/');
  $route = "$method $r";
  preg_match('~^(leads|users|uploads|history)/([A-Za-z0-9._-]+)(/[a-z0-9-]+)?$~', $r, $m);

  if ($method !== 'GET') {
    if (!str_starts_with((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) fail(415, 'Send JSON.');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin && $origin !== 'null' && parse_url($origin, PHP_URL_HOST) !== parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST)) fail(403, 'Cross-site request blocked.');
  }

  /* first run: database + owner account */
  $installed = db_config() !== null;
  if ($route === 'GET auth/setup') {
    $needsOwner = !$installed || !row('SELECT id FROM rh_users LIMIT 1');
    out(200, ['needsSetup' => $needsOwner, 'needsDb' => !$installed, 'drivers' => array_values(array_intersect(['mysql', 'sqlite'], PDO::getAvailableDrivers()))]);
  }
  if ($route === 'POST auth/setup') {
    $b = body(8000);
    if ($installed && row('SELECT id FROM rh_users LIMIT 1')) fail(403, 'Setup is already done. Sign in instead.');
    if (!valid_email($b['email'] ?? null)) fail(400, 'Enter a valid email.');
    if ($p = pw_problem($b['password'] ?? null)) fail(400, $p);
    if (!$installed) db_install((array)($b['db'] ?? []));
    db_schema(db());
    $u = create_user($b, 'owner');
    db_seed($u);
    $GLOBALS['ME'] = $u;
    ensure_published();
    activity('setup', 'Database installed and owner account created');
    start_session(); sign_in($u);
    out(201, ['user' => user_out($u)]);
  }
  if (!$installed) fail(503, 'The admin panel is not set up yet. Open /admin/ to run the installer.', ['needsSetup' => true]);

  /* public */
  if ($route === 'GET content') out(200, content(), ['Cache-Control: no-cache']);
  if ($route === 'POST leads') {
    $b = body(64000);
    if (!empty($b['website'])) out(201, ['ok' => true]); // honeypot filled by a bot
    if (throttle('lead|' . client_ip(), 10, 3600)) fail(429, 'Too many messages from your connection. Please try again later or call us.');
    $lead = clean_lead($b);
    insert_lead($lead);
    notify_owner($lead);
    out(201, ['ok' => true, 'id' => $lead['id']]);
  }

  start_session();
  if ($route === 'POST auth/login') {
    $b = body(8000);
    $email = strtolower(trim((string)($b['email'] ?? '')));
    $key = 'login|' . client_ip() . '|' . $email;
    if (throttle($key, 8, 900, false)) fail(429, 'Too many attempts. Wait 15 minutes and try again.');
    $u = row('SELECT * FROM rh_users WHERE email = ?', [$email]);
    if (!$u || !password_verify((string)($b['password'] ?? ''), $u['password'])) {
      throttle($key, 8, 900); usleep(300000);
      activity('login.failed', $email, $email);
      fail(401, 'Wrong email or password.');
    }
    if (!empty($u['totp_secret'])) {
      if (trim((string)($b['code'] ?? '')) === '') fail(401, 'Enter the 6-digit code from your authenticator app.', ['need2fa' => true]);
      $step = totp_check($u['totp_secret'], (string)$b['code'], (int)$u['totp_last']);
      if (!$step) { throttle($key, 8, 900); activity('login.failed', 'Wrong two-step code', $email); fail(401, 'That code is not correct or has expired. Try the newest code.', ['need2fa' => true]); }
      q('UPDATE rh_users SET totp_last = ? WHERE id = ?', [$step, $u['id']]);
    }
    if (password_needs_rehash($u['password'], PASSWORD_DEFAULT)) q('UPDATE rh_users SET password = ? WHERE id = ?', [password_hash((string)$b['password'], PASSWORD_DEFAULT), $u['id']]);
    clear_throttle($key);
    q('UPDATE rh_users SET last_login = ? WHERE id = ?', [now_iso(), $u['id']]);
    sign_in($u);
    activity('login', '', $u['email']);
    out(200, ['user' => user_out($u)]);
  }

  /* signed in */
  $ME = current_user();
  if (!$ME) fail(401, 'Please sign in.');
  if ($method !== 'GET' && ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') !== 'rh-admin') fail(403, 'Missing request header.');
  $owner = $ME['role'] === 'owner';
  if (!str_starts_with($r, 'auth/2fa') && $r !== 'auth/logout') session_write_close(); // don't block parallel requests

  if ($route === 'GET auth/me') { ensure_published(); out(200, ['user' => user_out($ME)]); }
  if ($route === 'POST auth/logout') { $_SESSION = []; session_destroy(); setcookie('rh_admin', '', ['expires' => 1, 'path' => '/', 'httponly' => true, 'samesite' => 'Strict', 'secure' => https()]); out(200, ['ok' => true]); }
  if ($route === 'POST auth/password') {
    $b = body(8000);
    if (!password_verify((string)($b['current'] ?? ''), $ME['password'])) fail(400, 'Current password is wrong.');
    if ($p = pw_problem($b['password'] ?? null)) fail(400, $p);
    q('UPDATE rh_users SET password = ?, pwv = pwv + 1 WHERE id = ?', [password_hash((string)$b['password'], PASSWORD_DEFAULT), $ME['id']]);
    start_session(); $_SESSION['pwv'] = (int)$ME['pwv'] + 1; session_write_close(); // other devices are signed out
    activity('password.change');
    out(200, ['ok' => true]);
  }
  if ($route === 'POST auth/2fa/start') {
    $secret = b32_encode(random_bytes(20));
    $_SESSION['totp_pending'] = $secret;
    $host = preg_replace('/[^A-Za-z0-9.-]/', '', (string)($_SERVER['HTTP_HOST'] ?? 'rh-admin'));
    out(200, ['secret' => $secret, 'uri' => 'otpauth://totp/' . rawurlencode('RH Admin (' . $host . '):' . $ME['email']) . '?secret=' . $secret . '&issuer=' . rawurlencode('RH Admin') . '&digits=6&period=30']);
  }
  if ($route === 'POST auth/2fa/enable') {
    $b = body(4000);
    $secret = (string)($_SESSION['totp_pending'] ?? '');
    if (!$secret) fail(400, 'Start the setup again.');
    $step = totp_check($secret, (string)($b['code'] ?? ''));
    if (!$step) fail(400, 'That code is not correct. Check the time on your phone and use the newest code.');
    q('UPDATE rh_users SET totp_secret = ?, totp_last = ? WHERE id = ?', [$secret, $step, $ME['id']]);
    unset($_SESSION['totp_pending']);
    activity('2fa.enable');
    out(200, ['ok' => true]);
  }
  if ($route === 'POST auth/2fa/disable') {
    $b = body(4000);
    if (!password_verify((string)($b['password'] ?? ''), $ME['password'])) fail(400, 'Password is wrong.');
    q('UPDATE rh_users SET totp_secret = NULL, totp_last = 0 WHERE id = ?', [$ME['id']]);
    activity('2fa.disable');
    out(200, ['ok' => true]);
  }

  if ($route === 'GET dashboard') {
    ensure_published();
    $c = content();
    $count = fn(string $where = '1=1', array $a = []) => (int)row("SELECT COUNT(*) AS n FROM rh_leads WHERE $where", $a)['n'];
    $by = []; foreach (KINDS as $k => $_) $by[$k] = $count('kind = ?', [$k]);
    out(200, [
      'leads' => ['total' => $count(), 'new' => $count("status = 'new'"), 'week' => $count('created_at > ?', [gmdate('Y-m-d\TH:i:s\Z', time() - 7 * 86400)]), 'byKind' => $by],
      'recent' => array_map('lead_out', rows('SELECT * FROM rh_leads ORDER BY created_at DESC LIMIT 6')),
      'content' => ['services' => count($c['services']), 'projects' => count($c['projects']), 'countries' => count($c['sourcing']['africa']) + count($c['sourcing']['asia']),
        'destinations' => count($c['destinations']['asia']) + count($c['destinations']['world']), 'uploads' => count(list_uploads())],
      'meta' => (object)meta(), 'database' => db()->getAttribute(PDO::ATTR_DRIVER_NAME)]);
  }

  if ($route === 'GET content/meta') out(200, (object)meta());
  if ($route === 'PUT content') {
    $b = body(3000000);
    $c = $b['content'] ?? null;
    if ($errs = validate_content($c)) fail(400, $errs[0], ['problems' => $errs]);
    $meta = meta();
    if (!empty($meta['version']) && ($b['base'] ?? '') !== $meta['version'] && empty($b['force']))
      fail(409, 'Someone else saved changes (' . ($meta['savedBy'] ?? '') . ') after you opened the editor.');
    $c = normalize_content($c);
    out(200, ['ok' => true, 'meta' => save_content($c, diff_label(setting('content'), $c))]);
  }
  if ($route === 'POST publish') {
    $c = content();
    set_setting('content_hash', publish_files($c, meta()['version'] ?? substr(uid(), 0, 12)));
    activity('site.republish', 'Website files rewritten from the database');
    out(200, ['ok' => true]);
  }
  if ($route === 'GET history') out(200, array_map(fn($v) => ['id' => $v['id'], 'at' => $v['created_at'], 'by' => $v['created_by'], 'size' => (int)$v['size']],
    rows('SELECT id, created_at, created_by, LENGTH(data) AS size FROM rh_versions ORDER BY id DESC')));
  if ($m && $m[1] === 'history' && $method === 'POST') {
    $v = row('SELECT * FROM rh_versions WHERE id = ?', [$m[2]]);
    if (!$v) fail(404, 'Version not found.');
    $old = json_decode($v['data'], true);
    if (validate_content($old)) fail(400, 'That version is no longer valid.');
    $old = normalize_content($old);
    $meta = save_content($old, 'Restored the version from ' . $v['created_at']);
    out(200, ['ok' => true, 'content' => $old, 'meta' => $meta]);
  }

  if ($route === 'GET leads') out(200, array_map('lead_out', rows('SELECT * FROM rh_leads ORDER BY created_at DESC LIMIT 5000')));
  if ($route === 'GET leads.csv') {
    $leads = array_map('lead_out', rows('SELECT * FROM rh_leads ORDER BY created_at DESC'));
    $extra = []; foreach ($leads as $l) foreach ($l['fields'] as $k => $_) if (!in_array((string)$k, $extra, true)) $extra[] = (string)$k;
    $out = [array_merge(['Date', 'Type', 'Status', 'Name', 'Email', 'Phone', 'Company'], $extra, ['Note'])];
    foreach ($leads as $l) $out[] = array_merge([$l['createdAt'], KINDS[$l['kind']] ?? $l['kind'], $l['status'], $l['name'], $l['email'], $l['phone'], $l['company']], array_map(fn($k) => ((array)$l['fields'])[$k] ?? '', $extra), [$l['note']]);
    activity('leads.export', count($leads) . ' leads');
    out(200, "\xEF\xBB\xBF" . implode("\r\n", array_map(fn($x) => implode(',', array_map('csv_cell', $x)), $out)), ['Content-Type: text/csv; charset=utf-8', 'Content-Disposition: attachment; filename="rh-leads-' . date('Y-m-d') . '.csv"']);
  }
  if ($m && $m[1] === 'leads' && in_array($method, ['PATCH', 'DELETE'], true)) {
    $l = row('SELECT * FROM rh_leads WHERE id = ?', [$m[2]]);
    if (!$l) fail(404, 'Enquiry not found.');
    if ($method === 'DELETE') { q('DELETE FROM rh_leads WHERE id = ?', [$m[2]]); activity('lead.delete', trim($l['name'] . ' ' . $l['email'])); out(200, ['ok' => true]); }
    $b = body(16000);
    $status = in_array($b['status'] ?? '', STATUSES, true) ? $b['status'] : $l['status'];
    $note = is_string($b['note'] ?? null) ? mb_substr($b['note'], 0, 4000) : $l['note'];
    q('UPDATE rh_leads SET status = ?, note = ?, updated_at = ?, updated_by = ? WHERE id = ?', [$status, $note, now_iso(), $ME['email'], $m[2]]);
    if ($status !== $l['status']) activity('lead.status', trim($l['name'] ?: $l['email']) . ': ' . $status);
    out(200, lead_out(row('SELECT * FROM rh_leads WHERE id = ?', [$m[2]])));
  }

  if ($route === 'GET uploads') out(200, list_uploads());
  if ($route === 'POST uploads') {
    $b = body(8000000);
    $ext = IMAGE_TYPES[$b['type'] ?? ''] ?? null;
    if (!$ext) fail(400, 'Upload a PNG, JPG, WebP or GIF image.');
    $bin = base64_decode((string)($b['data'] ?? ''), true);
    if (!$bin || strlen($bin) > 5 * 1024 * 1024) fail(400, 'Images must be smaller than 5 MB.');
    $info = @getimagesizefromstring($bin);
    if (!$info || ($info['mime'] ?? '') !== $b['type']) fail(400, 'The file is not a valid ' . strtoupper($ext) . ' image.');
    $base = trim((string)preg_replace('/[^a-z0-9]+/', '-', strtolower(pathinfo((string)($b['name'] ?? 'image'), PATHINFO_FILENAME))), '-');
    $name = substr($base ?: 'image', 0, 40) . '-' . bin2hex(random_bytes(3)) . '.' . $ext;
    write_file("$UPLOADS/$name", $bin);
    activity('image.upload', $name);
    out(201, ['name' => $name, 'url' => "assets/uploads/$name", 'size' => strlen($bin), 'width' => $info[0], 'height' => $info[1]]);
  }
  if ($m && $m[1] === 'uploads' && $method === 'DELETE') {
    $f = "$UPLOADS/" . basename($m[2]);
    if (!is_file($f)) fail(404, 'File not found.');
    if (str_contains(j(content()), 'assets/uploads/' . basename($m[2]))) fail(409, 'This image is used on the website. Remove it from the content first.');
    unlink($f);
    activity('image.delete', basename($m[2]));
    out(200, ['ok' => true]);
  }

  /* owner only */
  if ((str_starts_with($r, 'users') || $r === 'activity' || $r === 'settings') && !$owner) fail(403, 'Only the owner can do this.');
  if ($route === 'GET users') out(200, array_map('user_out', rows('SELECT * FROM rh_users ORDER BY created_at')));
  if ($route === 'POST users') {
    $b = body(8000);
    if (!valid_email($b['email'] ?? null)) fail(400, 'Enter a valid email.');
    if ($p = pw_problem($b['password'] ?? null)) fail(400, $p);
    $u = create_user($b, ($b['role'] ?? '') === 'owner' ? 'owner' : 'editor');
    activity('user.add', $u['email'] . ' (' . $u['role'] . ')');
    out(201, user_out($u));
  }
  if ($m && $m[1] === 'users' && $method === 'DELETE') {
    if ($m[2] === $ME['id']) fail(400, 'You cannot remove your own account.');
    $u = row('SELECT email FROM rh_users WHERE id = ?', [$m[2]]);
    q('DELETE FROM rh_users WHERE id = ?', [$m[2]]);
    activity('user.remove', $u['email'] ?? $m[2]);
    out(200, ['ok' => true]);
  }
  if ($m && $m[1] === 'users' && ($m[3] ?? '') === '/reset-2fa' && $method === 'POST') {
    q('UPDATE rh_users SET totp_secret = NULL, totp_last = 0, pwv = pwv + 1 WHERE id = ?', [$m[2]]);
    activity('2fa.reset', (string)(row('SELECT email FROM rh_users WHERE id = ?', [$m[2]])['email'] ?? ''));
    out(200, ['ok' => true]);
  }
  if ($route === 'GET activity') out(200, rows('SELECT at, who, action, detail, ip FROM rh_activity ORDER BY at DESC, id DESC LIMIT 300'));
  if ($route === 'GET settings') out(200, (object)setting('settings', []));
  if ($route === 'PUT settings') {
    $b = body(8000);
    $email = trim((string)($b['notifyEmail'] ?? ''));
    if ($email !== '' && !valid_email($email)) fail(400, 'Enter a valid email address for notifications, or leave it empty.');
    set_setting('settings', ['notifyEmail' => $email]);
    activity('settings.save', $email ? 'Lead alerts to ' . $email : 'Lead alerts off');
    out(200, ['ok' => true]);
  }

  fail(404, 'Not found.');
} catch (HttpError $e) {
  out($e->status, ['error' => $e->getMessage()] + $e->extra);
} catch (Throwable $e) {
  error_log('RH admin API: ' . $e);
  out(500, ['error' => 'Server error.']);
}
