<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Ezzetask-Token');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Missing config.php — copy config.example.php']);
    exit;
}

require __DIR__ . '/lib/Util.php';
require __DIR__ . '/lib/Database.php';
require __DIR__ . '/lib/Response.php';
require __DIR__ . '/lib/Auth.php';
require __DIR__ . '/lib/Mappers.php';
require __DIR__ . '/lib/AuthService.php';
require __DIR__ . '/handlers/AuthHandler.php';
require __DIR__ . '/handlers/MembersHandler.php';
require __DIR__ . '/handlers/ProjectsHandler.php';
require __DIR__ . '/handlers/TasksHandler.php';
require __DIR__ . '/handlers/AnalyticsHandler.php';
require __DIR__ . '/handlers/AttachmentsHandler.php';

set_exception_handler(static function (Throwable $e): void {
    if ($e instanceof PDOException) {
        Response::error(
            'Database connection failed. In config.php use the full MySQL user from cPanel (not your cPanel login name).',
            503,
        );
        exit;
    }
    error_log($e->getMessage());
    Response::error('Server error', 500);
    exit;
});
