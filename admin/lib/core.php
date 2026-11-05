<?php
/* Core helpers: JSON responses, errors, safe file writes, request parsing. */
declare(strict_types=1);

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

function write_file(string $file, string $data): void {
  $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
  if (file_put_contents($tmp, $data, LOCK_EX) === false) fail(500, 'The server cannot write ' . basename($file) . '. Check folder permissions.');
  if (!rename($tmp, $file)) { @unlink($tmp); fail(500, 'The server cannot save ' . basename($file) . '.'); }
}

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
