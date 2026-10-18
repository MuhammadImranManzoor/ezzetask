<?php

declare(strict_types=1);

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

if (str_starts_with($uri, '/api')) {
    $apiPath = __DIR__ . $uri;
    if ($uri !== '/api' && is_file($apiPath)) {
        require $apiPath;
        return true;
    }
    require __DIR__ . '/api/index.php';
    return true;
}

$file = __DIR__ . $uri;
if ($uri !== '/' && is_file($file)) {
    return false;
}

readfile(__DIR__ . '/index.html');
return true;
