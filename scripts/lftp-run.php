<?php

declare(strict_types=1);

/**
 * Run lftp with GoDaddy-friendly FTPS; password is not passed through the shell.
 * Env: DEPLOY_FTP_HOST, DEPLOY_FTP_USER, DEPLOY_FTP_PASS
 * Arg1: path to file containing lftp commands (after connect).
 */

$user = getenv('DEPLOY_FTP_USER') ?: '';
$pass = getenv('DEPLOY_FTP_PASS') ?: '';
$host = getenv('DEPLOY_FTP_HOST') ?: '';
$bodyPath = $argv[1] ?? '';

if ($user === '' || $host === '' || $bodyPath === '' || !is_readable($bodyPath)) {
    fwrite(STDERR, "lftp-run.php: missing DEPLOY_FTP_* env or body file\n");
    exit(1);
}

$body = file_get_contents($bodyPath);
$url = 'ftps://' . rawurlencode($user) . ':' . rawurlencode($pass) . '@' . $host;

$header = <<<LFTP
set cmd:fail-exit yes
set ftp:passive-mode yes
set ftp:ssl-allow yes
set ftp:ssl-force yes
set ftp:ssl-protect-data true
set ssl:verify-certificate no
open {$url}
pwd
LFTP;

$script = $header . "\n" . $body . "\nquit\n";
$tmp = tempnam(sys_get_temp_dir(), 'ezzetask-lftp-');
file_put_contents($tmp, $script);
chmod($tmp, 0600);

$lftp = trim((string) shell_exec('command -v lftp'));
if ($lftp === '') {
    unlink($tmp);
    fwrite(STDERR, "lftp not found\n");
    exit(1);
}

$cmd = escapeshellarg($lftp) . ' -f ' . escapeshellarg($tmp);
passthru($cmd, $code);
unlink($tmp);
exit($code);
