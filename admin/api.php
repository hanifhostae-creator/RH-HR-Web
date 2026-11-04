<?php
/*
 * RH Business Solutions — back end API (PHP 8.1+, no database, no Composer).
 * Works on Hostinger shared hosting (Apache/LiteSpeed + .htaccess) and with
 * PHP's built-in server for local work:  php -S localhost:8000 admin/router.php
 *
 * Routes (the root .htaccess rewrites /api/<route> to admin/api.php?r=<route>):
 *   public   GET content · POST leads · POST auth/login · GET|POST auth/setup
 *   signed in GET auth/me · POST auth/logout · POST auth/password · GET dashboard
 *            GET|PUT content · GET content/meta · GET history · POST history/<id>
 *            GET leads · GET leads.csv · PATCH|DELETE leads/<id>
 *            GET|POST uploads · DELETE uploads/<name>
 *            GET|POST users · DELETE users/<id>  (owner only)
 *
 * Storage (admin/data/, blocked from the web by admin/data/.htaccess):
 *   leads.json, users.json, meta.json, throttle.json, history/<stamp>.json
 * Website content lives in assets/js/content.js (window.SITE) — this API reads it
 * and rewrites it on every save, so the public pages show changes immediately.
 */
declare(strict_types=1);

const SESSION_HOURS = 12;
const HISTORY_KEEP = 50;
const KINDS = ['general' => 'Contact form', 'company' => 'Hire staff request', 'agent' => 'Partner request'];
const STATUSES = ['new', 'contacted', 'done', 'archived'];
const IMAGE_TYPES = ['image/png' => 'png', 'image/jpeg' => 'jpg', 'image/webp' => 'webp', 'image/gif' => 'gif'];

$ROOT = dirname(__DIR__);
$DATA = getenv('RH_DATA_DIR') ?: __DIR__ . '/data';
$CONTENT_JS = $ROOT . '/assets/js/content.js';
$UPLOADS = $ROOT . '/assets/uploads';
foreach ([$DATA, "$DATA/history", $UPLOADS] as $d) if (!is_dir($d)) @mkdir($d, 0755, true);
if (!file_exists("$DATA/.htaccess")) @file_put_contents("$DATA/.htaccess", "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Deny from all\n</IfModule>\n");
if (!file_exists("$DATA/index.html")) @file_put_contents("$DATA/index.html", '');

/* ---------- responses ---------- */
final class HttpError extends Exception { public function __construct(public int $status, string $msg, public array $extra = []) { parent::__construct($msg); } }
function out(int $status, $body, array $headers = []): never {
  http_response_code($status);
  header('Cache-Control: no-store');
  header('X-Content-Type-Options: nosniff');
  foreach ($headers as $h) header($h);
  if (is_string($body)) { echo $body; exit; }
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
function fail(int $status, string $msg, array $extra = []): never { throw new HttpError($status, $msg, $extra); }

/* ---------- JSON files (atomic writes with a lock) ---------- */
function read_json(string $file, $fallback) {
  if (!is_file($file)) return $fallback;
  $v = json_decode((string)file_get_contents($file), true);
  return $v === null ? $fallback : $v;
}
function write_file(string $file, string $data): void {
  $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
  if (file_put_contents($tmp, $data, LOCK_EX) === false) fail(500, 'The server cannot write ' . basename($file) . '. Check folder permissions.');
  if (!rename($tmp, $file)) { @unlink($tmp); fail(500, 'The server cannot save ' . basename($file) . '.'); }
}
function write_json(string $file, $v): void { write_file($file, json_encode($v, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)); }
/** Read-modify-write a JSON file under an exclusive lock. */
function update_json(string $file, $fallback, callable $fn) {
  $lock = fopen($file . '.lock', 'c');
  flock($lock, LOCK_EX);
  try { $v = read_json($file, $fallback); $r = $fn($v); write_json($file, $v); return $r; }
  finally { flock($lock, LOCK_UN); fclose($lock); }
}

/* ---------- content.js <-> PHP ---------- */
/** Turn the JS object literal in content.js into JSON (handles comments, bare keys, single quotes, trailing commas). */
function js_to_json(string $src): string {
  $i = strpos($src, 'window.SITE');
  if ($i === false) fail(500, 'content.js does not define window.SITE.');
  $src = substr($src, strpos($src, '=', $i) + 1);
  $o = ''; $n = strlen($src); $depth = 0; $started = false;
  for ($k = 0; $k < $n; $k++) {
    $c = $src[$k];
    if ($c === '"' || $c === "'") {
      $q = $c; $s = '';
      for ($k++; $k < $n && $src[$k] !== $q; $k++) {
        if ($src[$k] === '\\') { $nx = $src[++$k]; $s .= ($nx === "'" ? "'" : '\\' . $nx); continue; }
        $s .= $src[$k] === '"' ? '\\"' : $src[$k];
      }
      $o .= '"' . $s . '"'; continue;
    }
    if ($c === '/' && ($src[$k + 1] ?? '') === '/') { while ($k < $n && $src[$k] !== "\n") $k++; continue; }
    if ($c === '/' && ($src[$k + 1] ?? '') === '*') { $k = strpos($src, '*/', $k + 2) + 1; continue; }
    if (ctype_alpha($c) || $c === '_' || $c === '$') {
      $w = ''; while ($k < $n && (ctype_alnum($src[$k]) || $src[$k] === '_' || $src[$k] === '$')) $w .= $src[$k++];
      $k--;
      $rest = ltrim(substr($src, $k + 1, 20));
      $o .= ($rest !== '' && $rest[0] === ':' && !in_array($w, ['true', 'false', 'null'], true)) ? '"' . $w . '"' : $w;
      continue;
    }
    if ($c === '{' || $c === '[') { $depth++; $started = true; }
    if ($c === '}' || $c === ']') { $o = rtrim($o); if (str_ends_with($o, ',')) $o = substr($o, 0, -1); $depth--; }
    $o .= $c;
    if ($started && $depth === 0) break;
  }
  return $o;
}
function load_content(): array {
  global $CONTENT_JS;
  $c = json_decode(js_to_json((string)file_get_contents($CONTENT_JS)), true);
  if (!is_array($c)) fail(500, 'assets/js/content.js could not be read: ' . json_last_error_msg());
  return $c;
}
function j($v): string { return json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION); }
function inline_js($v): string {
  if (is_array($v) && array_is_list($v)) return '[' . implode(', ', array_map('inline_js', $v)) . ']';
  if (is_array($v)) { $p = []; foreach ($v as $k => $x) $p[] = j((string)$k) . ': ' . inline_js($x); return '{ ' . implode(', ', $p) . ' }'; }
  return j($v);
}
function flat_list($v): bool { if (!is_array($v) || !array_is_list($v)) return false; foreach ($v as $x) if (is_array($x) && !flat_list($x)) return false; return true; }
function pretty_js($v, string $ind = ''): string {
  $next = $ind . '  ';
  if (is_array($v) && array_is_list($v)) {
    if (!$v) return '[]';
    $allLists = !array_filter($v, fn($x) => !(is_array($x) && array_is_list($x)));
    if (flat_list($v) && ($allLists || strlen(inline_js($v)) < 110)) return inline_js($v);
    return "[\n" . implode(",\n", array_map(fn($x) => $next . pretty_js($x, $next), $v)) . "\n$ind]";
  }
  if (is_array($v)) {
    $simple = true; foreach ($v as $x) if (is_array($x) && !flat_list($x)) $simple = false;
    if ($simple && strlen(inline_js($v)) < 120) return inline_js($v);
    $p = []; foreach ($v as $k => $x) $p[] = $next . j((string)$k) . ': ' . pretty_js($x, $next);
    return "{\n" . implode(",\n", $p) . "\n$ind}";
  }
  return j($v);
}
function write_content_js(array $c): void {
  global $CONTENT_JS;
  $js = "/*\n * RH Business Solutions — website content\n * ------------------------------------------------------------\n"
    . " * Managed by the admin panel (/admin/). Saving in the admin panel rewrites\n"
    . " * this file, so edit content there rather than by hand.\n"
    . " * Keep the keys stable — see \"Content contract\" in CLAUDE.md.\n */\n"
    . 'window.SITE = ' . str_ireplace('</script', '<\/script', pretty_js($c)) . ";\n";
  write_file($CONTENT_JS, $js);
}

/* ---------- validation ---------- */
function is_obj($v): bool { return is_array($v) && ($v === [] || !array_is_list($v)); }
function is_list($v): bool { return is_array($v) && array_is_list($v); }
function str($v): bool { return is_string($v); }
function img_ok($v): bool { return $v === null || $v === '' || (is_string($v) && preg_match('~^(assets/uploads/[A-Za-z0-9._-]+|https://\S+)$~', $v)); }
function validate_content($c): array {
  $e = [];
  $need = function ($ok, $msg) use (&$e) { if (!$ok) $e[] = $msg; };
  if (!is_obj($c)) return ['Content must be an object.'];
  $co = $c['company'] ?? null;
  $need(is_obj($co), 'company is required.');
  if (is_obj($co)) {
    foreach (['name', 'short', 'phone', 'email'] as $k) $need(str($co[$k] ?? null) && trim($co[$k]) !== '', "Company $k is required.");
    $need(img_ok($co['logo'] ?? ''), 'The logo must be an uploaded image or an https:// address.');
  }
  $need(is_list($c['nav'] ?? null), 'nav must be a list.');
  $need(is_obj($c['hero'] ?? null) && is_list($c['hero']['words'] ?? null), 'hero.words must be a list.');
  foreach ($c['hero']['words'] ?? [] as $i => $w) $need(is_obj($w) && str($w['text'] ?? null) && (empty($w['color']) || preg_match('/^#[0-9a-f]{3,8}$/i', (string)$w['color'])), 'Hero word ' . ($i + 1) . ' needs text and a #hex colour.');
  foreach (['stats', 'recruitmentItems', 'process', 'hiringSteps', 'projects', 'emirates'] as $k) $need(is_list($c[$k] ?? null), "$k must be a list.");
  $need(is_list($c['services'] ?? null) && count($c['services']) > 0, 'At least one service is required.');
  $seen = [];
  foreach ($c['services'] ?? [] as $i => $s) {
    $n = 'Service ' . ($i + 1);
    if (!is_obj($s)) { $e[] = "$n is invalid."; continue; }
    $id = $s['id'] ?? '';
    $need(str($id) && preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $id), "$n: page id may only use lowercase letters, numbers and dashes (e.g. web-development).");
    $need(!isset($seen[$id]), "$n: page id \"$id\" is used twice.");
    $seen[$id] = 1;
    $need(str($s['name'] ?? null) && trim($s['name']) !== '', "$n: name is required.");
    $need(in_array($s['group'] ?? '', ['recruitment', 'business'], true), "$n: group must be recruitment or business.");
    foreach (['points', 'tags'] as $k) $need(!isset($s[$k]) || (is_list($s[$k]) && !array_filter($s[$k], fn($x) => !is_string($x))), "$n: $k must be a list of text.");
    $need(img_ok($s['image'] ?? ''), "$n: image must be an uploaded image or an https:// address.");
  }
  foreach ($c['projects'] ?? [] as $i => $p) $need(is_obj($p) && img_ok($p['image'] ?? ''), 'Project ' . ($i + 1) . ': image must be an uploaded image or an https:// address.');
  $tuples = function ($list, string $name, bool $pos) use ($need) {
    $need(is_list($list), "$name must be a list.");
    foreach (is_list($list) ? $list : [] as $i => $t)
      $need(is_list($t) && preg_match('/^[a-z]{2}$/', (string)($t[0] ?? '')) && str($t[1] ?? null) && trim($t[1]) !== ''
        && (!$pos || (is_numeric($t[2] ?? null) && is_numeric($t[3] ?? null) && abs($t[2]) <= 180 && abs($t[3]) <= 90)),
        "$name row " . ($i + 1) . ' needs a 2-letter flag code, a country name' . ($pos ? ', longitude and latitude' : '') . '.');
  };
  $need(is_obj($c['sourcing'] ?? null), 'sourcing is required.');
  $tuples($c['sourcing']['africa'] ?? null, 'Sourcing · Africa', true);
  $tuples($c['sourcing']['asia'] ?? null, 'Sourcing · Asia', true);
  $need(is_obj($c['destinations'] ?? null), 'destinations is required.');
  $tuples($c['destinations']['asia'] ?? null, 'Destinations · Asia', false);
  $tuples($c['destinations']['world'] ?? null, 'Destinations · World', false);
  return $e;
}
/** Restore JSON shapes PHP loses (numbers in tuples must stay numbers). */
function normalize_content(array $c): array {
  foreach (['africa', 'asia'] as $g) foreach ($c['sourcing'][$g] as $i => $t) { $c['sourcing'][$g][$i] = [$t[0], $t[1], (float)$t[2], (float)$t[3]]; }
  foreach (['asia', 'world'] as $g) foreach ($c['destinations'][$g] as $i => $t) { $c['destinations'][$g][$i] = [$t[0], $t[1]]; }
  if (empty($c['company']['logo'])) $c['company']['logo'] = '';
  return $c;
}

/* ---------- static service pages + sitemap ---------- */
function esc(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function plain(string $s): string { return str_replace('**', '', $s); }
/**
 * Keeps one service-<id>.html per service so new services work without a build step:
 * creates pages for new services (copying an existing service page as a template),
 * refreshes the SEO tags of every service page, removes pages of deleted services
 * and rewrites the service URLs in sitemap.xml. For fully pre-rendered pages run
 * `node tools/build-site.js` (see admin/README.md).
 */
function sync_service_pages(array $c): void {
  global $ROOT;
  $files = glob("$ROOT/service-*.html") ?: [];
  if (!$files) return;
  $tpl = (string)file_get_contents($files[0]);
  preg_match('~<link rel="canonical" href="(https?://[^"/]+)~', $tpl, $m);
  $site = $m[1] ?? '';
  $C = $c['company'];
  $keep = [];
  foreach ($c['services'] as $s) {
    $file = "$ROOT/service-{$s['id']}.html";
    $keep[] = basename($file);
    $html = is_file($file) ? (string)file_get_contents($file) : preg_replace('~(<main id="main">).*?(</main>)~s', '$1$2', $tpl);
    $title = "{$s['name']} in Dubai, UAE | {$C['short']}";
    $desc = mb_substr(plain($s['summary'] ?? '') . ' ' . (($s['group'] ?? '') === 'recruitment' ? 'Recruitment agency in Dubai, UAE.' : 'Based in Dubai, UAE.'), 0, 300);
    $url = "$site/service-{$s['id']}.html";
    $org = "$site/#organization";
    $ld = ['@context' => 'https://schema.org', '@graph' => [
      ['@type' => 'BreadcrumbList', 'itemListElement' => [
        ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => "$site/"],
        ['@type' => 'ListItem', 'position' => 2, 'name' => 'Services', 'item' => "$site/services.html"],
        ['@type' => 'ListItem', 'position' => 3, 'name' => $s['name'], 'item' => $url]]],
      ['@type' => 'Service', 'name' => $s['name'], 'description' => $s['text'] ?? '', 'serviceType' => $s['short'] ?? $s['name'], 'areaServed' => ['@type' => 'Country', 'name' => 'United Arab Emirates'], 'provider' => ['@id' => $org], 'url' => $url]]];
    $rep = [
      '~<title>.*?</title>~s' => '<title>' . esc($title) . '</title>',
      '~<meta name="description" content="[^"]*">~' => '<meta name="description" content="' . esc($desc) . '">',
      '~<link rel="canonical" href="[^"]*">~' => '<link rel="canonical" href="' . esc($url) . '">',
      '~<meta property="og:title" content="[^"]*">~' => '<meta property="og:title" content="' . esc($title) . '">',
      '~<meta property="og:description" content="[^"]*">~' => '<meta property="og:description" content="' . esc($desc) . '">',
      '~<meta property="og:url" content="[^"]*">~' => '<meta property="og:url" content="' . esc($url) . '">',
      '~<meta name="twitter:title" content="[^"]*">~' => '<meta name="twitter:title" content="' . esc($title) . '">',
      '~<meta name="twitter:description" content="[^"]*">~' => '<meta name="twitter:description" content="' . esc($desc) . '">',
      '~<script type="application/ld\+json">.*?</script>~s' => '<script type="application/ld+json">' . str_replace('<', '<', j($ld)) . '</script>',
      '~data-page="service" data-id="[^"]*"~' => 'data-page="service" data-id="' . esc($s['id']) . '"',
    ];
    foreach ($rep as $re => $to) $html = preg_replace_callback($re, fn() => $to, $html, 1);
    if (!is_file($file) || file_get_contents($file) !== $html) write_file($file, $html);
  }
  foreach ($files as $f) if (!in_array(basename($f), $keep, true)) @unlink($f);
  $map = "$ROOT/sitemap.xml";
  if (is_file($map) && $site) {
    $xml = preg_replace('~\s*<url><loc>[^<]*/service-[a-z0-9-]+\.html</loc>.*?</url>~', '', (string)file_get_contents($map));
    $today = date('Y-m-d');
    $rows = implode('', array_map(fn($s) => "\n  <url><loc>$site/service-{$s['id']}.html</loc><lastmod>$today</lastmod><priority>0.9</priority></url>", $c['services']));
    write_file($map, str_replace("\n</urlset>", "$rows\n</urlset>", $xml));
  }
}

function save_content(array $next, array $user): array {
  global $DATA;
  $stamp = gmdate('Y-m-d\TH-i-s') . '-' . substr((string)microtime(), 2, 3) . 'Z';
  write_json("$DATA/history/$stamp.json", load_content());
  $old = glob("$DATA/history/*.json") ?: [];
  sort($old);
  foreach (array_slice($old, 0, max(0, count($old) - HISTORY_KEEP)) as $f) @unlink($f);
  write_content_js($next);
  sync_service_pages($next);
  return update_json("$DATA/meta.json", [], function (&$m) use ($user) {
    $m['savedAt'] = gmdate('c'); $m['savedBy'] = $user['email']; $m['version'] = bin2hex(random_bytes(6));
    return $m;
  });
}

/* ---------- request helpers ---------- */
function body(int $limit): array {
  $len = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
  if ($len > $limit) fail(413, 'The request is too large.');
  $raw = (string)file_get_contents('php://input', false, null, 0, $limit + 1);
  if (strlen($raw) > $limit) fail(413, 'The request is too large.');
  if ($raw === '') return [];
  $v = json_decode($raw, true);
  if (!is_array($v)) fail(400, 'Invalid JSON.');
  return $v;
}
function client_ip(): string { return (string)($_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? ''); }
function https(): bool { return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https' || ($_SERVER['SERVER_PORT'] ?? '') === '443'; }
/** Sliding-window counter stored in throttle.json. Returns true when over the limit. */
function throttle(string $key, int $max, int $window, bool $hit = true): bool {
  global $DATA;
  return update_json("$DATA/throttle.json", [], function (&$t) use ($key, $max, $window, $hit) {
    $now = time();
    foreach ($t as $k => $list) { $t[$k] = array_values(array_filter($list, fn($x) => $now - $x < 3600)); if (!$t[$k]) unset($t[$k]); }
    $list = array_values(array_filter($t[$key] ?? [], fn($x) => $now - $x < $window));
    if ($hit) $list[] = $now;
    if ($list) $t[$key] = $list; else unset($t[$key]);
    return $hit ? count($list) > $max : count($list) >= $max;
  });
}
function clear_throttle(string $key): void { global $DATA; update_json("$DATA/throttle.json", [], function (&$t) use ($key) { unset($t[$key]); }); }

/* ---------- users & sessions ---------- */
function users(): array { global $DATA; return read_json("$DATA/users.json", []); }
function public_user(array $u): array { return array_intersect_key($u, array_flip(['id', 'email', 'name', 'role', 'createdAt', 'lastLogin'])); }
function pw_problem($pw): string { return !is_string($pw) || strlen($pw) < 10 ? 'Password must be at least 10 characters.' : (strlen($pw) > 200 ? 'Password is too long.' : ''); }
function valid_email($e): bool { return is_string($e) && (bool)filter_var($e, FILTER_VALIDATE_EMAIL); }
function new_user(array $b, string $role): array {
  return ['id' => bin2hex(random_bytes(8)), 'email' => strtolower(trim((string)$b['email'])), 'name' => mb_substr(trim((string)($b['name'] ?? '')), 0, 80),
    'role' => $role, 'password' => password_hash((string)$b['password'], PASSWORD_DEFAULT), 'pwv' => 1, 'createdAt' => gmdate('c')];
}
function start_session(): void {
  session_name('rh_admin');
  session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => https(), 'httponly' => true, 'samesite' => 'Strict']);
  ini_set('session.use_strict_mode', '1');
  ini_set('session.gc_maxlifetime', (string)(SESSION_HOURS * 3600));
  session_start();
}
function sign_in(array $u): void {
  session_regenerate_id(true);
  $_SESSION = ['uid' => $u['id'], 'pwv' => $u['pwv'] ?? 1, 'at' => time()];
}
function current_user(): ?array {
  if (empty($_SESSION['uid']) || time() - ($_SESSION['at'] ?? 0) > SESSION_HOURS * 3600) return null;
  foreach (users() as $u) if ($u['id'] === $_SESSION['uid'] && ($u['pwv'] ?? 1) === ($_SESSION['pwv'] ?? 1)) return $u;
  return null;
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
  return ['id' => bin2hex(random_bytes(8)), 'kind' => isset(KINDS[$b['kind'] ?? '']) ? $b['kind'] : 'general', 'status' => 'new', 'createdAt' => gmdate('c'),
    'page' => mb_substr((string)($b['page'] ?? ''), 0, 200),
    'name' => $f['Name'] ?? $f['Your name'] ?? $f['Contact person'] ?? '', 'email' => $email, 'phone' => $f['Phone'] ?? $f['Phone (optional)'] ?? '',
    'company' => $f['Company name'] ?? $f['Agency or company name'] ?? '', 'fields' => $f, 'note' => '',
    'ip' => client_ip(), 'userAgent' => mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 300)];
}
function notify_owner(array $lead): void {
  // Optional e-mail alert. Set RH_NOTIFY_EMAIL (or create admin/data/notify.txt with the address).
  global $DATA;
  $to = getenv('RH_NOTIFY_EMAIL') ?: trim((string)@file_get_contents("$DATA/notify.txt"));
  if (!valid_email($to)) return;
  $lines = []; foreach ($lead['fields'] as $k => $v) $lines[] = "$k: $v";
  $host = preg_replace('/[^A-Za-z0-9.-]/', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost'));
  $headers = "From: Website <no-reply@$host>\r\nContent-Type: text/plain; charset=utf-8";
  if (valid_email($lead['email'])) $headers .= "\r\nReply-To: " . $lead['email'];
  @mail($to, '=?UTF-8?B?' . base64_encode('New ' . KINDS[$lead['kind']] . ' — ' . ($lead['name'] ?: $lead['email'])) . '?=', implode("\n", $lines) . "\n\nOpen the leads inbox: https://$host/admin/#leads", $headers);
}
function csv_cell($v): string { $s = (string)$v; if (preg_match('/^[=+\-@\t\r]/', $s)) $s = "'" . $s; return '"' . str_replace('"', '""', $s) . '"'; }

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
  preg_match('~^(leads|users|uploads|history)/([A-Za-z0-9._-]+)$~', $r, $m);

  if ($method !== 'GET') {
    if (!str_starts_with((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) fail(415, 'Send JSON.');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin && $origin !== 'null' && parse_url($origin, PHP_URL_HOST) !== parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST)) fail(403, 'Cross-site request blocked.');
  }

  /* public */
  if ($route === 'GET content') out(200, load_content(), ['Cache-Control: no-cache']);
  if ($route === 'POST leads') {
    $b = body(64000);
    if (!empty($b['website'])) out(201, ['ok' => true]); // honeypot filled by a bot
    if (throttle('lead|' . client_ip(), 10, 3600)) fail(429, 'Too many messages from your connection. Please try again later or call us.');
    $lead = clean_lead($b);
    update_json("$DATA/leads.json", [], function (&$l) use ($lead) { array_unshift($l, $lead); });
    notify_owner($lead);
    out(201, ['ok' => true, 'id' => $lead['id']]);
  }

  start_session();
  if ($route === 'GET auth/setup') out(200, ['needsSetup' => !users()]);
  if ($route === 'POST auth/setup') {
    if (users()) fail(403, 'Setup is already done. Sign in instead.');
    $b = body(8000);
    if (!valid_email($b['email'] ?? null)) fail(400, 'Enter a valid email.');
    if ($p = pw_problem($b['password'] ?? null)) fail(400, $p);
    $u = new_user($b, 'owner');
    update_json("$DATA/users.json", [], function (&$l) use ($u) { if ($l) fail(403, 'Setup is already done.'); $l[] = $u; });
    sign_in($u);
    out(201, ['user' => public_user($u)]);
  }
  if ($route === 'POST auth/login') {
    $b = body(8000);
    $email = strtolower(trim((string)($b['email'] ?? '')));
    $key = 'login|' . client_ip() . '|' . $email;
    if (throttle($key, 8, 900, false)) fail(429, 'Too many attempts. Wait 15 minutes and try again.');
    $u = null; foreach (users() as $x) if ($x['email'] === $email) $u = $x;
    if (!$u || !password_verify((string)($b['password'] ?? ''), $u['password'])) { throttle($key, 8, 900); usleep(300000); fail(401, 'Wrong email or password.'); }
    clear_throttle($key);
    update_json("$DATA/users.json", [], function (&$l) use ($u) { foreach ($l as &$x) if ($x['id'] === $u['id']) $x['lastLogin'] = gmdate('c'); });
    sign_in($u);
    out(200, ['user' => public_user($u)]);
  }

  /* signed in */
  $me = current_user();
  if (!$me) fail(401, 'Please sign in.');
  if ($method !== 'GET' && ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') !== 'rh-admin') fail(403, 'Missing request header.');
  $owner = $me['role'] === 'owner';
  session_write_close(); // don't block parallel requests

  if ($route === 'GET auth/me') out(200, ['user' => public_user($me)]);
  if ($route === 'POST auth/logout') { session_start(); $_SESSION = []; session_destroy(); setcookie('rh_admin', '', ['expires' => 1, 'path' => '/', 'httponly' => true, 'samesite' => 'Strict', 'secure' => https()]); out(200, ['ok' => true]); }
  if ($route === 'POST auth/password') {
    $b = body(8000);
    if (!password_verify((string)($b['current'] ?? ''), $me['password'])) fail(400, 'Current password is wrong.');
    if ($p = pw_problem($b['password'] ?? null)) fail(400, $p);
    $pwv = update_json("$DATA/users.json", [], function (&$l) use ($me, $b) { foreach ($l as &$x) if ($x['id'] === $me['id']) { $x['password'] = password_hash((string)$b['password'], PASSWORD_DEFAULT); $x['pwv'] = ($x['pwv'] ?? 1) + 1; return $x['pwv']; } });
    session_start(); $_SESSION['pwv'] = $pwv; session_write_close(); // other devices are signed out
    out(200, ['ok' => true]);
  }

  if ($route === 'GET dashboard') {
    $leads = read_json("$DATA/leads.json", []); $c = load_content();
    $by = []; foreach (KINDS as $k => $_) $by[$k] = count(array_filter($leads, fn($l) => $l['kind'] === $k));
    $week = time() - 7 * 86400;
    out(200, [
      'leads' => ['total' => count($leads), 'new' => count(array_filter($leads, fn($l) => $l['status'] === 'new')), 'week' => count(array_filter($leads, fn($l) => strtotime($l['createdAt']) > $week)), 'byKind' => $by],
      'recent' => array_map(fn($l) => array_intersect_key($l, array_flip(['id', 'kind', 'name', 'company', 'email', 'createdAt', 'status'])), array_slice($leads, 0, 6)),
      'content' => ['services' => count($c['services']), 'projects' => count($c['projects']), 'countries' => count($c['sourcing']['africa']) + count($c['sourcing']['asia']),
        'destinations' => count($c['destinations']['asia']) + count($c['destinations']['world']), 'uploads' => count(list_uploads())],
      'meta' => read_json("$DATA/meta.json", (object)[])]);
  }

  if ($route === 'GET content/meta') out(200, read_json("$DATA/meta.json", (object)[]));
  if ($route === 'PUT content') {
    $b = body(3000000);
    $c = $b['content'] ?? null;
    if ($errs = validate_content($c)) fail(400, $errs[0], ['problems' => $errs]);
    $meta = read_json("$DATA/meta.json", []);
    if (!empty($meta['version']) && ($b['base'] ?? '') !== $meta['version'] && empty($b['force']))
      fail(409, 'Someone else saved changes (' . ($meta['savedBy'] ?? '') . ') after you opened the editor.');
    out(200, ['ok' => true, 'meta' => save_content(normalize_content($c), $me)]);
  }
  if ($route === 'GET history') {
    $out = [];
    foreach (array_reverse(glob("$DATA/history/*.json") ?: []) as $f) $out[] = ['id' => basename($f, '.json'), 'size' => filesize($f)];
    out(200, $out);
  }
  if ($m && $m[1] === 'history' && $method === 'POST') {
    $f = "$DATA/history/" . basename($m[2]) . '.json';
    if (!is_file($f)) fail(404, 'Version not found.');
    $old = read_json($f, null);
    if (validate_content($old)) fail(400, 'That version is no longer valid.');
    $old = normalize_content($old);
    $meta = save_content($old, $me);
    out(200, ['ok' => true, 'content' => $old, 'meta' => $meta]);
  }

  if ($route === 'GET leads') out(200, read_json("$DATA/leads.json", []));
  if ($route === 'GET leads.csv') {
    $leads = read_json("$DATA/leads.json", []);
    $extra = []; foreach ($leads as $l) foreach ($l['fields'] as $k => $_) if (!in_array($k, $extra, true)) $extra[] = (string)$k;
    $rows = [array_merge(['Date', 'Type', 'Status', 'Name', 'Email', 'Phone', 'Company'], $extra, ['Note'])];
    foreach ($leads as $l) $rows[] = array_merge([$l['createdAt'], KINDS[$l['kind']] ?? $l['kind'], $l['status'], $l['name'], $l['email'], $l['phone'], $l['company']], array_map(fn($k) => $l['fields'][$k] ?? '', $extra), [$l['note']]);
    out(200, "\xEF\xBB\xBF" . implode("\r\n", array_map(fn($r) => implode(',', array_map('csv_cell', $r)), $rows)), ['Content-Type: text/csv; charset=utf-8', 'Content-Disposition: attachment; filename="rh-leads-' . date('Y-m-d') . '.csv"']);
  }
  if ($m && $m[1] === 'leads' && in_array($method, ['PATCH', 'DELETE'], true)) {
    $b = $method === 'PATCH' ? body(16000) : [];
    $res = update_json("$DATA/leads.json", [], function (&$list) use ($m, $method, $b, $me) {
      foreach ($list as $i => &$l) if ($l['id'] === $m[2]) {
        if ($method === 'DELETE') { array_splice($list, $i, 1); return ['ok' => true]; }
        if (in_array($b['status'] ?? '', STATUSES, true)) $l['status'] = $b['status'];
        if (is_string($b['note'] ?? null)) $l['note'] = mb_substr($b['note'], 0, 4000);
        $l['updatedAt'] = gmdate('c'); $l['updatedBy'] = $me['email'];
        return $l;
      }
      return null;
    });
    if (!$res) fail(404, 'Enquiry not found.');
    out(200, $res);
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
    out(201, ['name' => $name, 'url' => "assets/uploads/$name", 'size' => strlen($bin), 'width' => $info[0], 'height' => $info[1]]);
  }
  if ($m && $m[1] === 'uploads' && $method === 'DELETE') {
    $f = "$UPLOADS/" . basename($m[2]);
    if (!is_file($f)) fail(404, 'File not found.');
    if (str_contains(j(load_content()), 'assets/uploads/' . basename($m[2]))) fail(409, 'This image is used on the website. Remove it from the content first.');
    unlink($f);
    out(200, ['ok' => true]);
  }

  if (str_starts_with($r, 'users') && !$owner) fail(403, 'Only the owner can manage users.');
  if ($route === 'GET users') out(200, array_map('public_user', users()));
  if ($route === 'POST users') {
    $b = body(8000);
    if (!valid_email($b['email'] ?? null)) fail(400, 'Enter a valid email.');
    if ($p = pw_problem($b['password'] ?? null)) fail(400, $p);
    $u = new_user($b, ($b['role'] ?? '') === 'owner' ? 'owner' : 'editor');
    update_json("$DATA/users.json", [], function (&$l) use ($u) { foreach ($l as $x) if ($x['email'] === $u['email']) fail(409, 'A user with this email already exists.'); $l[] = $u; });
    out(201, public_user($u));
  }
  if ($m && $m[1] === 'users' && $method === 'DELETE') {
    if ($m[2] === $me['id']) fail(400, 'You cannot remove your own account.');
    update_json("$DATA/users.json", [], function (&$l) use ($m) { $l = array_values(array_filter($l, fn($u) => $u['id'] !== $m[2])); });
    out(200, ['ok' => true]);
  }

  fail(404, 'Not found.');
} catch (HttpError $e) {
  out($e->status, ['error' => $e->getMessage()] + $e->extra);
} catch (Throwable $e) {
  error_log('RH admin API: ' . $e);
  out(500, ['error' => 'Server error.']);
}
