<?php

declare(strict_types=1);

final class ProjectsHandler
{
    public static function list(): void
    {
        if (!Auth::requireAuth()) {
            return;
        }
        $pdo = Database::pdo();
        $rows = $pdo->query('SELECT * FROM projects ORDER BY sort_order, created_at')->fetchAll();
        Response::json(array_map([Mappers::class, 'project'], $rows));
    }

    public static function create(): void
    {
        if (!Auth::requireAdmin()) {
            return;
        }
        $body = json_body();
        $name = trim((string) ($body['name'] ?? ''));
        $colorIndex = (int) ($body['colorIndex'] ?? 0);
        if ($name === '') {
            Response::error('Name required', 400);
            return;
        }
        $pdo = Database::pdo();
        $last = $pdo->query('SELECT sort_order FROM projects ORDER BY sort_order DESC LIMIT 1')->fetch();
        $sortOrder = $last ? (int) $last['sort_order'] + 1 : 0;
        $project = [
            'id' => uuid_v4(),
            'name' => $name,
            'color_index' => $colorIndex,
            'sort_order' => $sortOrder,
            'created_at' => (int) (microtime(true) * 1000),
        ];
        $pdo->prepare(
            'INSERT INTO projects (id, name, color_index, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
        )->execute([
            $project['id'],
            $project['name'],
            $project['color_index'],
            $project['sort_order'],
            $project['created_at'],
        ]);
        Response::json(Mappers::project($project), 201);
    }

    public static function patch(string $id): void
    {
        if (!Auth::requireAdmin()) {
            return;
        }
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM projects WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            Response::error('Project not found', 404);
            return;
        }
        $body = json_body();
        $updates = [];
        $params = [];
        if (array_key_exists('name', $body)) {
            $name = trim((string) $body['name']);
            if ($name === '') {
                Response::error('Name cannot be empty', 400);
                return;
            }
            $updates[] = 'name = ?';
            $params[] = $name;
        }
        if (array_key_exists('colorIndex', $body)) {
            $updates[] = 'color_index = ?';
            $params[] = (int) $body['colorIndex'];
        }
        if ($updates !== []) {
            $params[] = $id;
            $pdo->prepare('UPDATE projects SET ' . implode(', ', $updates) . ' WHERE id = ?')->execute($params);
        }
        $stmt = $pdo->prepare('SELECT * FROM projects WHERE id = ?');
        $stmt->execute([$id]);
        Response::json(Mappers::project($stmt->fetch()));
    }

    public static function delete(string $id): void
    {
        if (!Auth::requireAdmin()) {
            return;
        }
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('DELETE FROM projects WHERE id = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) {
            Response::error('Project not found', 404);
            return;
        }
        Response::noContent();
    }
}
