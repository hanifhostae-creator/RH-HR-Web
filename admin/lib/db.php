<?php
/*
 * Database layer (PDO). MySQL/MariaDB on Hostinger; SQLite also works (local dev, tests).
 * Connection settings live in admin/data/config.php, written by the first-run installer
 * (or set RH_DB_DRIVER / RH_DB_HOST / RH_DB_NAME / RH_DB_USER / RH_DB_PASS / RH_DB_PATH).
 * All tables use the prefix rh_ so they can share a database with other apps.
 */
declare(strict_types=1);

const DB_TABLES = [
  'settings' => 'k VARCHAR(64) NOT NULL PRIMARY KEY, v MEDIUMTEXT NOT NULL',
  'users' => 'id VARCHAR(32) NOT NULL PRIMARY KEY, email VARCHAR(190) NOT NULL UNIQUE, name VARCHAR(120) NOT NULL DEFAULT \'\', role VARCHAR(16) NOT NULL,
    password VARCHAR(255) NOT NULL, pwv INT NOT NULL DEFAULT 1, totp_secret VARCHAR(64) NULL, totp_last BIGINT NOT NULL DEFAULT 0,
    created_at VARCHAR(32) NOT NULL, last_login VARCHAR(32) NULL',
  'leads' => 'id VARCHAR(32) NOT NULL PRIMARY KEY, kind VARCHAR(16) NOT NULL, status VARCHAR(16) NOT NULL, created_at VARCHAR(32) NOT NULL,
    name VARCHAR(200) NOT NULL DEFAULT \'\', email VARCHAR(200) NOT NULL DEFAULT \'\', phone VARCHAR(80) NOT NULL DEFAULT \'\', company VARCHAR(200) NOT NULL DEFAULT \'\',
    page VARCHAR(200) NOT NULL DEFAULT \'\', fields MEDIUMTEXT NOT NULL, note TEXT NULL, ip VARCHAR(64) NOT NULL DEFAULT \'\', user_agent VARCHAR(300) NOT NULL DEFAULT \'\',
    updated_at VARCHAR(32) NULL, updated_by VARCHAR(190) NULL',
  'versions' => 'id VARCHAR(40) NOT NULL PRIMARY KEY, created_at VARCHAR(32) NOT NULL, created_by VARCHAR(190) NOT NULL DEFAULT \'\', data MEDIUMTEXT NOT NULL',
  'activity' => 'id VARCHAR(32) NOT NULL PRIMARY KEY, at VARCHAR(32) NOT NULL, who VARCHAR(190) NOT NULL DEFAULT \'\', action VARCHAR(60) NOT NULL, detail VARCHAR(500) NOT NULL DEFAULT \'\', ip VARCHAR(64) NOT NULL DEFAULT \'\'',
  'throttle' => 'id VARCHAR(32) NOT NULL PRIMARY KEY, k VARCHAR(190) NOT NULL, t BIGINT NOT NULL',
];

function db_config(): ?array {
  global $DATA;
  if (getenv('RH_DB_DRIVER')) return ['driver' => getenv('RH_DB_DRIVER'), 'host' => getenv('RH_DB_HOST') ?: 'localhost', 'name' => getenv('RH_DB_NAME') ?: '',
    'user' => getenv('RH_DB_USER') ?: '', 'pass' => getenv('RH_DB_PASS') ?: '', 'path' => getenv('RH_DB_PATH') ?: "$DATA/rh.sqlite"];
  $f = "$DATA/config.php";
  return is_file($f) ? (require $f) : null;
}
function db_connect(array $c): PDO {
  $opt = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false];
  if (($c['driver'] ?? '') === 'sqlite') {
    $pdo = new PDO('sqlite:' . $c['path'], null, null, $opt);
    $pdo->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
    return $pdo;
  }
  $port = !empty($c['port']) ? ';port=' . (int)$c['port'] : '';
  return new PDO('mysql:host=' . $c['host'] . $port . ';dbname=' . $c['name'] . ';charset=utf8mb4', $c['user'], $c['pass'], $opt);
}
function db(): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;
  $c = db_config();
  if (!$c) fail(503, 'The database is not set up yet. Open /admin/ to run the installer.', ['needsSetup' => true]);
  try { $pdo = db_connect($c); }
  catch (PDOException $e) { error_log('RH DB: ' . $e->getMessage()); fail(503, 'Cannot connect to the database. Check the database details in admin/data/config.php.'); }
  return $pdo;
}
function q(string $sql, array $args = []): PDOStatement { $s = db()->prepare($sql); $s->execute($args); return $s; }
function row(string $sql, array $args = []): ?array { $r = q($sql, $args)->fetch(); return $r ?: null; }
function rows(string $sql, array $args = []): array { return q($sql, $args)->fetchAll(); }
function uid(): string { return bin2hex(random_bytes(8)); }
function now_iso(): string { return gmdate('Y-m-d\TH:i:s\Z'); }

function db_schema(PDO $pdo): void {
  $mysql = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
  foreach (DB_TABLES as $t => $cols)
    $pdo->exec("CREATE TABLE IF NOT EXISTS rh_$t ($cols)" . ($mysql ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : ''));
}

/* ---------- settings (key/value JSON) ---------- */
function setting(string $k, $default = null) { $r = row('SELECT v FROM rh_settings WHERE k = ?', [$k]); return $r ? json_decode($r['v'], true) : $default; }
function set_setting(string $k, $v): void { q('REPLACE INTO rh_settings (k, v) VALUES (?, ?)', [$k, json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION)]); }

/* ---------- installer ---------- */
/** First run: test the connection, create tables, import existing content, write config.php. */
function db_install(array $in): void {
  global $DATA;
  $driver = ($in['driver'] ?? 'mysql') === 'sqlite' ? 'sqlite' : 'mysql';
  $c = $driver === 'sqlite' ? ['driver' => 'sqlite', 'path' => "$DATA/rh.sqlite"]
    : ['driver' => 'mysql', 'host' => trim((string)($in['host'] ?? '')) ?: 'localhost', 'name' => trim((string)($in['name'] ?? '')), 'user' => trim((string)($in['user'] ?? '')), 'pass' => (string)($in['pass'] ?? '')];
  if ($driver === 'mysql' && ($c['name'] === '' || $c['user'] === '')) fail(400, 'Enter the database name, user and password from hPanel → Databases.');
  if ($driver === 'sqlite' && !in_array('sqlite', PDO::getAvailableDrivers(), true)) fail(400, 'SQLite is not available on this server. Use MySQL.');
  try { $pdo = db_connect($c); db_schema($pdo); }
  catch (PDOException $e) {
    $m = $e->getMessage();
    $hint = str_contains($m, 'Access denied') ? 'Wrong database user or password.' : (str_contains($m, 'Unknown database') ? 'That database name does not exist. Create it in hPanel → Databases first.' : 'Check the host, database name, user and password.');
    fail(400, 'Could not connect to the database. ' . $hint);
  }
  write_file("$DATA/config.php", "<?php\n// Database settings written by the RH admin installer. Keep this file private.\nreturn " . var_export($c, true) . ";\n");
  @chmod("$DATA/config.php", 0600);
}
/** Seed content (from content.js) and move data from the older JSON-file version, once. */
function db_seed(array $user): void {
  global $DATA;
  if (setting('content') === null) {
    set_setting('content', read_content_file());
    set_setting('meta', ['savedAt' => now_iso(), 'savedBy' => $user['email'], 'version' => bin2hex(random_bytes(6))]);
    set_setting('content_hash', '');
  }
  $old = is_file("$DATA/leads.json") ? json_decode((string)file_get_contents("$DATA/leads.json"), true) : null;
  if (is_array($old) && !row('SELECT id FROM rh_leads LIMIT 1')) {
    foreach (array_reverse($old) as $l) insert_lead($l);
    @rename("$DATA/leads.json", "$DATA/leads.imported.json");
  }
}

/* ---------- throttling ---------- */
function throttle(string $key, int $max, int $window, bool $hit = true): bool {
  $now = time();
  if (random_int(1, 20) === 1) q('DELETE FROM rh_throttle WHERE t < ?', [$now - 86400]);
  if ($hit) q('INSERT INTO rh_throttle (id, k, t) VALUES (?, ?, ?)', [uid(), $key, $now]);
  $n = (int)row('SELECT COUNT(*) AS n FROM rh_throttle WHERE k = ? AND t > ?', [$key, $now - $window])['n'];
  return $hit ? $n > $max : $n >= $max;
}
function clear_throttle(string $key): void { q('DELETE FROM rh_throttle WHERE k = ?', [$key]); }

/* ---------- activity log ---------- */
function activity(string $action, string $detail = '', ?string $who = null): void {
  global $ME;
  q('INSERT INTO rh_activity (id, at, who, action, detail, ip) VALUES (?, ?, ?, ?, ?, ?)',
    [uid(), now_iso(), $who ?? ($ME['email'] ?? ''), $action, mb_substr($detail, 0, 500), client_ip()]);
}

/* ---------- leads ---------- */
function insert_lead(array $l): void {
  q('INSERT INTO rh_leads (id, kind, status, created_at, name, email, phone, company, page, fields, note, ip, user_agent, updated_at, updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [
    $l['id'], $l['kind'], $l['status'], $l['createdAt'], mb_substr((string)$l['name'], 0, 200), mb_substr((string)$l['email'], 0, 200), mb_substr((string)$l['phone'], 0, 80),
    mb_substr((string)$l['company'], 0, 200), $l['page'] ?? '', json_encode($l['fields'], JSON_UNESCAPED_UNICODE), $l['note'] ?? '', $l['ip'] ?? '', $l['userAgent'] ?? '', $l['updatedAt'] ?? null, $l['updatedBy'] ?? null]);
}
function lead_out(array $r): array {
  return ['id' => $r['id'], 'kind' => $r['kind'], 'status' => $r['status'], 'createdAt' => $r['created_at'], 'name' => $r['name'], 'email' => $r['email'], 'phone' => $r['phone'],
    'company' => $r['company'], 'page' => $r['page'], 'fields' => json_decode($r['fields'], true) ?: (object)[], 'note' => (string)$r['note'],
    'updatedAt' => $r['updated_at'], 'updatedBy' => $r['updated_by']];
}

/* ---------- users ---------- */
function user_out(array $u): array {
  return ['id' => $u['id'], 'email' => $u['email'], 'name' => $u['name'], 'role' => $u['role'], 'createdAt' => $u['created_at'], 'lastLogin' => $u['last_login'], 'twoFactor' => !empty($u['totp_secret'])];
}
function create_user(array $b, string $role): array {
  $u = ['id' => uid(), 'email' => strtolower(trim((string)$b['email'])), 'name' => mb_substr(trim((string)($b['name'] ?? '')), 0, 120), 'role' => $role,
    'password' => password_hash((string)$b['password'], PASSWORD_DEFAULT), 'created_at' => now_iso()];
  if (row('SELECT id FROM rh_users WHERE email = ?', [$u['email']])) fail(409, 'A user with this email already exists.');
  q('INSERT INTO rh_users (id, email, name, role, password, pwv, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)', [$u['id'], $u['email'], $u['name'], $u['role'], $u['password'], $u['created_at']]);
  return row('SELECT * FROM rh_users WHERE id = ?', [$u['id']]);
}

/* ---------- two-step verification (TOTP, RFC 6238 — Google Authenticator, Microsoft Authenticator, Authy) ---------- */
function b32_encode(string $bin): string {
  $a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; $bits = ''; $out = '';
  foreach (str_split($bin) as $ch) $bits .= str_pad(decbin(ord($ch)), 8, '0', STR_PAD_LEFT);
  foreach (str_split($bits, 5) as $chunk) $out .= $a[bindec(str_pad($chunk, 5, '0'))];
  return $out;
}
function b32_decode(string $s): string {
  $a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; $bits = ''; $out = '';
  foreach (str_split(strtoupper(preg_replace('/[^A-Za-z2-7]/', '', $s))) as $ch) $bits .= str_pad(decbin(strpos($a, $ch)), 5, '0', STR_PAD_LEFT);
  foreach (str_split($bits, 8) as $byte) if (strlen($byte) === 8) $out .= chr(bindec($byte));
  return $out;
}
function totp_code(string $secret, int $counter): string {
  $h = hash_hmac('sha1', pack('J', $counter), b32_decode($secret), true);
  $o = ord($h[19]) & 0xf;
  $n = ((ord($h[$o]) & 0x7f) << 24) | (ord($h[$o + 1]) << 16) | (ord($h[$o + 2]) << 8) | ord($h[$o + 3]);
  return str_pad((string)($n % 1000000), 6, '0', STR_PAD_LEFT);
}
/** Returns the matching time step (±30 s allowed) or 0. */
function totp_check(string $secret, string $code, int $after = 0): int {
  $code = preg_replace('/\D/', '', $code);
  if (strlen($code) !== 6) return 0;
  $now = intdiv(time(), 30);
  for ($i = -1; $i <= 1; $i++) { $c = $now + $i; if ($c > $after && hash_equals(totp_code($secret, $c), $code)) return $c; }
  return 0;
}
