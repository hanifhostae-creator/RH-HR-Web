<?php
/*
 * Router for PHP's built-in web server (local development / preview only).
 * Hostinger uses the .htaccess files instead.
 *   php -S localhost:8000 admin/router.php      → site: http://localhost:8000/  admin: /admin/
 */
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
if (preg_match('~^/api/(.*)$~', $path, $m)) { $_GET['r'] = $m[1]; require __DIR__ . '/api.php'; return true; }
if (preg_match('~(^|/)\.|^/(tools|admin/data)(/|$)|\.(md|py|lock|tmp|php)$~i', $path)) { http_response_code(404); echo 'Not found'; return true; }
if (str_starts_with($path, '/admin')) {
  header('Content-Security-Policy: ' . "default-src 'self'; img-src 'self' data: https:; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
  header('X-Frame-Options: DENY');
  header('Cache-Control: no-store');
}
return false; // let the built-in server send the static file
