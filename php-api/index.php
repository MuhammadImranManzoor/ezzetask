<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$uri = preg_replace('#^/api#', '', $uri);
$uri = trim($uri, '/');
$segments = $uri === '' ? [] : explode('/', $uri);

// health
if ($method === 'GET' && ($segments[0] ?? '') === 'health') {
    Response::json(['ok' => true]);
    exit;
}

// auth (public except me)
if (($segments[0] ?? '') === 'auth') {
    $action = $segments[1] ?? '';
    if ($method === 'POST' && $action === 'session') {
        AuthHandler::session();
        exit;
    }
    if ($method === 'POST' && $action === 'login') {
        AuthHandler::login();
        exit;
    }
    if ($method === 'GET' && $action === 'me') {
        AuthHandler::me();
        exit;
    }
    Response::error('Not found', 404);
    exit;
}

$resource = $segments[0] ?? '';
$id = $segments[1] ?? null;

switch ($resource) {
    case 'members':
        if ($method === 'GET' && $id === null) {
            MembersHandler::list();
        } elseif ($method === 'POST' && $id === null) {
            MembersHandler::create();
        } elseif ($method === 'PATCH' && $id !== null) {
            MembersHandler::patch($id);
        } elseif ($method === 'DELETE' && $id !== null) {
            MembersHandler::delete($id);
        } else {
            Response::error('Not found', 404);
        }
        break;

    case 'projects':
        if ($method === 'GET' && $id === null) {
            ProjectsHandler::list();
        } elseif ($method === 'POST' && $id === null) {
            ProjectsHandler::create();
        } elseif ($method === 'PATCH' && $id !== null) {
            ProjectsHandler::patch($id);
        } elseif ($method === 'DELETE' && $id !== null) {
            ProjectsHandler::delete($id);
        } else {
            Response::error('Not found', 404);
        }
        break;

    case 'tasks':
        $sub = $segments[2] ?? null;
        $attachmentId = $segments[3] ?? null;
        if ($id !== null && $sub === 'attachments') {
            if ($method === 'GET' && $attachmentId === null) {
                AttachmentsHandler::listForTask($id);
            } elseif ($method === 'POST' && $attachmentId === null) {
                AttachmentsHandler::upload($id);
            } elseif ($method === 'DELETE' && $attachmentId !== null) {
                AttachmentsHandler::delete($id, $attachmentId);
            } elseif ($method === 'GET' && $attachmentId !== null && ($segments[4] ?? '') === 'file') {
                AttachmentsHandler::file($id, $attachmentId);
            } else {
                Response::error('Not found', 404);
            }
            break;
        }
        if ($method === 'GET' && $id === null) {
            TasksHandler::list();
        } elseif ($method === 'POST' && $id === null) {
            TasksHandler::create();
        } elseif ($method === 'PATCH' && $id !== null) {
            TasksHandler::patch($id);
        } elseif ($method === 'DELETE' && $id !== null) {
            TasksHandler::delete($id);
        } else {
            Response::error('Not found', 404);
        }
        break;

    case 'attachments':
        if ($method === 'GET' && ($segments[1] ?? '') === 'counts') {
            AttachmentsHandler::counts();
        } else {
            Response::error('Not found', 404);
        }
        break;

    case 'analytics':
        if ($method === 'GET' && ($segments[1] ?? '') === 'productivity') {
            AnalyticsHandler::productivity();
        } else {
            Response::error('Not found', 404);
        }
        break;

    default:
        Response::error('Not found', 404);
}
