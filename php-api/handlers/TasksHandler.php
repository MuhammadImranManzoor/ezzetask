<?php

declare(strict_types=1);

final class TasksHandler
{
    /** @return array{completed_at: ?int, updated_at: int} */
    private static function applyStatusTimestamps(string $status, ?int $previousCompletedAt): array
    {
        $updatedAt = (int) (microtime(true) * 1000);
        if ($status === 'done') {
            return [
                'completed_at' => $previousCompletedAt ?? $updatedAt,
                'updated_at' => $updatedAt,
            ];
        }
        return ['completed_at' => null, 'updated_at' => $updatedAt];
    }

    public static function list(): void
    {
        if (!Auth::requireAuth()) {
            return;
        }
        $pdo = Database::pdo();
        $rows = $pdo->query('SELECT * FROM tasks ORDER BY updated_at DESC')->fetchAll();
        Response::json(array_map([Mappers::class, 'task'], $rows));
    }

    public static function create(): void
    {
        if (!Auth::requireAuth()) {
            return;
        }
        $body = json_body();
        $title = trim((string) ($body['title'] ?? ''));
        $projectId = (string) ($body['projectId'] ?? '');
        $assigneeId = $body['assigneeId'] ?? null;
        $status = $body['status'] ?? 'todo';
        if ($title === '' || $projectId === '') {
            Response::error('Title and project required', 400);
            return;
        }
        if (!$assigneeId) {
            Response::error('Assignee required', 400);
            return;
        }
        if (!in_array($status, ['todo', 'inProgress', 'done'], true)) {
            Response::error('Invalid status', 400);
            return;
        }
        $pdo = Database::pdo();
        $chk = $pdo->prepare('SELECT id FROM projects WHERE id = ?');
        $chk->execute([$projectId]);
        if (!$chk->fetch()) {
            Response::error('Invalid project', 400);
            return;
        }
        $now = (int) (microtime(true) * 1000);
        $ts = self::applyStatusTimestamps($status, null);
        $task = [
            'id' => uuid_v4(),
            'project_id' => $projectId,
            'title' => $title,
            'task_description' => (string) ($body['taskDescription'] ?? ''),
            'status' => $status,
            'assignee_id' => $assigneeId,
            'created_at' => $now,
            'updated_at' => $ts['updated_at'],
            'completed_at' => $ts['completed_at'],
            'deadline' => $body['deadline'] ?? null,
            'notification_enabled' => ($body['notificationEnabled'] ?? true) === false ? 0 : 1,
        ];
        $pdo->prepare(
            'INSERT INTO tasks (id, project_id, title, task_description, status, assignee_id, created_at, updated_at, completed_at, deadline, notification_enabled)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )->execute([
            $task['id'],
            $task['project_id'],
            $task['title'],
            $task['task_description'],
            $task['status'],
            $task['assignee_id'],
            $task['created_at'],
            $task['updated_at'],
            $task['completed_at'],
            $task['deadline'],
            $task['notification_enabled'],
        ]);
        Response::json(Mappers::task($task), 201);
    }

    public static function patch(string $id): void
    {
        if (!Auth::requireAuth()) {
            return;
        }
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM tasks WHERE id = ?');
        $stmt->execute([$id]);
        $existing = $stmt->fetch();
        if (!$existing) {
            Response::error('Task not found', 404);
            return;
        }
        $body = json_body();
        $nextStatus = $body['status'] ?? $existing['status'];
        $prevCompleted = $existing['completed_at'] !== null ? (int) $existing['completed_at'] : null;
        $ts = self::applyStatusTimestamps($nextStatus, $prevCompleted);

        $title = array_key_exists('title', $body) ? trim((string) $body['title']) : $existing['title'];
        $desc = array_key_exists('taskDescription', $body)
            ? (string) $body['taskDescription']
            : $existing['task_description'];
        $assigneeId = array_key_exists('assigneeId', $body) ? $body['assigneeId'] : $existing['assignee_id'];
        $deadline = array_key_exists('deadline', $body) ? $body['deadline'] : $existing['deadline'];
        $notif = array_key_exists('notificationEnabled', $body)
            ? ($body['notificationEnabled'] ? 1 : 0)
            : (int) $existing['notification_enabled'];

        $pdo->prepare(
            'UPDATE tasks SET title = ?, task_description = ?, status = ?, assignee_id = ?, deadline = ?, notification_enabled = ?, updated_at = ?, completed_at = ? WHERE id = ?',
        )->execute([
            $title,
            $desc,
            $nextStatus,
            $assigneeId,
            $deadline,
            $notif,
            $ts['updated_at'],
            $ts['completed_at'],
            $id,
        ]);
        $stmt = $pdo->prepare('SELECT * FROM tasks WHERE id = ?');
        $stmt->execute([$id]);
        Response::json(Mappers::task($stmt->fetch()));
    }

    public static function delete(string $id): void
    {
        if (!Auth::requireAuth()) {
            return;
        }
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('DELETE FROM tasks WHERE id = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) {
            Response::error('Task not found', 404);
            return;
        }
        Response::noContent();
    }
}
