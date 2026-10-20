<?php

declare(strict_types=1);

final class AttachmentsHandler
{
    private const MAX_BYTES = 8 * 1024 * 1024;

    /** @return array<string, int> taskId => count */
    public static function counts(): void
    {
        if (!Auth::requireAuth()) {
            return;
        }
        $pdo = Database::pdo();
        $rows = $pdo->query(
            'SELECT task_id, COUNT(*) AS c FROM task_attachments GROUP BY task_id',
        )->fetchAll();
        $out = [];
        foreach ($rows as $row) {
            $out[(string) $row['task_id']] = (int) $row['c'];
        }
        Response::json($out);
    }

    public static function listForTask(string $taskId): void
    {
        if (!Auth::requireAuth()) {
            return;
        }
        if (!self::taskExists($taskId)) {
            Response::error('Task not found', 404);
            return;
        }
        $pdo = Database::pdo();
        $stmt = $pdo->prepare(
            'SELECT id, task_id, file_name, mime_type, sort_order, created_at
             FROM task_attachments WHERE task_id = ? ORDER BY sort_order ASC, created_at ASC',
        );
        $stmt->execute([$taskId]);
        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = self::mapMeta($row);
        }
        Response::json($items);
    }

    public static function upload(string $taskId): void
    {
        if (!Auth::requireAuth()) {
            return;
        }
        if (!self::taskExists($taskId)) {
            Response::error('Task not found', 404);
            return;
        }
        if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
            Response::error('Image file required', 400);
            return;
        }
        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::error('Upload failed', 400);
            return;
        }
        if ($file['size'] > self::MAX_BYTES) {
            Response::error('Image must be 8 MB or smaller', 400);
            return;
        }
        $mime = (string) ($file['type'] ?? '');
        if ($mime === '' || !str_starts_with($mime, 'image/')) {
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime = $finfo->file($file['tmp_name']) ?: 'application/octet-stream';
        }
        if (!str_starts_with($mime, 'image/')) {
            Response::error('Only image files are allowed', 400);
            return;
        }
        $data = file_get_contents($file['tmp_name']);
        if ($data === false) {
            Response::error('Could not read upload', 400);
            return;
        }
        $pdo = Database::pdo();
        $orderStmt = $pdo->prepare(
            'SELECT COALESCE(MAX(sort_order), -1) + 1 FROM task_attachments WHERE task_id = ?',
        );
        $orderStmt->execute([$taskId]);
        $sortOrder = (int) $orderStmt->fetchColumn();
        $id = uuid_v4();
        $now = (int) (microtime(true) * 1000);
        $name = basename((string) ($file['name'] ?? 'image'));
        if (strlen($name) > 255) {
            $name = substr($name, -255);
        }
        $pdo->prepare(
            'INSERT INTO task_attachments (id, task_id, file_name, mime_type, sort_order, data, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)',
        )->execute([$id, $taskId, $name, $mime, $sortOrder, $data, $now]);
        Response::json([
            'id' => $id,
            'taskId' => $taskId,
            'fileName' => $name,
            'mimeType' => $mime,
            'sortOrder' => $sortOrder,
            'createdAt' => $now,
        ], 201);
    }

    public static function delete(string $taskId, string $attachmentId): void
    {
        if (!Auth::requireAuth()) {
            return;
        }
        $pdo = Database::pdo();
        $stmt = $pdo->prepare(
            'DELETE FROM task_attachments WHERE id = ? AND task_id = ?',
        );
        $stmt->execute([$attachmentId, $taskId]);
        if ($stmt->rowCount() === 0) {
            Response::error('Attachment not found', 404);
            return;
        }
        Response::noContent();
    }

    public static function file(string $taskId, string $attachmentId): void
    {
        if (!Auth::requireAuth()) {
            return;
        }
        $pdo = Database::pdo();
        $stmt = $pdo->prepare(
            'SELECT file_name, mime_type, data FROM task_attachments WHERE id = ? AND task_id = ?',
        );
        $stmt->execute([$attachmentId, $taskId]);
        $row = $stmt->fetch();
        if (!$row) {
            Response::error('Attachment not found', 404);
            return;
        }
        header('Content-Type: ' . (string) $row['mime_type']);
        header('Content-Length: ' . strlen((string) $row['data']));
        header('Cache-Control: private, max-age=3600');
        echo $row['data'];
        exit;
    }

    private static function taskExists(string $taskId): bool
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id FROM tasks WHERE id = ?');
        $stmt->execute([$taskId]);
        return (bool) $stmt->fetch();
    }

    /** @param array<string, mixed> $row */
    private static function mapMeta(array $row): array
    {
        return [
            'id' => (string) $row['id'],
            'taskId' => (string) $row['task_id'],
            'fileName' => (string) $row['file_name'],
            'mimeType' => (string) $row['mime_type'],
            'sortOrder' => (int) $row['sort_order'],
            'createdAt' => (int) $row['created_at'],
        ];
    }
}
