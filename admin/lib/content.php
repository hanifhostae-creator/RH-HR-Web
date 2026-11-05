<?php
/*
 * Website content: assets/js/content.js <-> PHP, validation, and keeping the
 * static service pages, sitemap.xml and cache-busting links in sync.
 */
declare(strict_types=1);

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
function read_content_file(): array {
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


/**
 * Point every page at the current content.js (?v=<version>) so browsers and any
 * Hostinger/CDN cache load the new content right after a save.
 */
function bust_cache(string $version): void {
  global $ROOT;
  $v = preg_replace('/[^a-z0-9]/i', '', $version);
  foreach (glob("$ROOT/*.html") ?: [] as $f) {
    $html = (string)file_get_contents($f);
    $new = preg_replace('~assets/js/content\.js(\?v=[a-z0-9]*)?"~i', 'assets/js/content.js?v=' . $v . '"', $html);
    if ($new !== null && $new !== $html) write_file($f, $new);
  }
}

/** Write the public website files from the content stored in the database. */
function publish_files(array $c, string $version): string {
  global $CONTENT_JS;
  write_content_js($c);
  sync_service_pages($c);
  bust_cache($version);
  return sha1_file($CONTENT_JS);
}
