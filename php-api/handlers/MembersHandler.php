<?php

declare(strict_types=1);

final class MembersHandler
{
    public static function list(): void
    {
        if (!Auth::requireAuth()) {
            return;
        }
        $pdo = Database::pdo();
        $rows = $pdo->query('SELECT * FROM members ORDER BY name')->fetchAll();
        Response::json(array_map([Mappers::class, 'member'], $rows));
    }

    public static function create(): void
    {
        if (!Auth::requireAdmin()) {
            return;
        }
        $body = json_body();
        $name = trim((string) ($body['name'] ?? ''));
        $team = $body['team'] ?? 'other';
        if ($name === '') {
            Response::error('Name required', 400);
            return;
        }
        if (!in_array($team, ['frontend', 'backend', 'other'], true)) {
            Response::error('Invalid team', 400);
            return;
        }
        $pdo = Database::pdo();
        $count = (int) $pdo->query('SELECT COUNT(*) FROM members')->fetchColumn();
        $member = [
            'id' => uuid_v4(),
            'name' => $name,
            'color_index' => $count % 8,
            'team' => $team,
            'created_at' => (int) (microtime(true) * 1000),
        ];
        $pdo->prepare(
            'INSERT INTO members (id, name, color_index, team, created_at) VALUES (?, ?, ?, ?, ?)',
        )->execute([
            $member['id'],
            $member['name'],
            $member['color_index'],
            $member['team'],
            $member['created_at'],
        ]);
        Response::json(Mappers::member($member), 201);
    }

    public static function patch(string $id): void
    {
        if (!Auth::requireAdmin()) {
            return;
        }
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM members WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            Response::error('Member not found', 404);
            return;
        }
        $body = json_body();
        $name = array_key_exists('name', $body) ? trim((string) $body['name']) : null;
        $team = array_key_exists('team', $body) ? $body['team'] : null;
        if ($name !== null && $name === '') {
            Response::error('Name cannot be empty', 400);
            return;
        }
        if ($team !== null && !in_array($team, ['frontend', 'backend', 'other'], true)) {
            Response::error('Invalid team', 400);
            return;
        }
        $updates = [];
        $params = [];
        if ($name !== null) {
            $updates[] = 'name = ?';
            $params[] = $name;
        }
        if ($team !== null) {
            $updates[] = 'team = ?';
            $params[] = $team;
        }
        if ($updates !== []) {
            $params[] = $id;
            $pdo->prepare('UPDATE members SET ' . implode(', ', $updates) . ' WHERE id = ?')->execute($params);
        }
        $stmt = $pdo->prepare('SELECT * FROM members WHERE id = ?');
        $stmt->execute([$id]);
        Response::json(Mappers::member($stmt->fetch()));
    }

    public static function delete(string $id): void
    {
        if (!Auth::requireAdmin()) {
            return;
        }
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('DELETE FROM members WHERE id = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) {
            Response::error('Member not found', 404);
            return;
        }
        $pdo->prepare('UPDATE tasks SET assignee_id = NULL WHERE assignee_id = ?')->execute([$id]);
        Response::noContent();
    }
}
