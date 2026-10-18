<?php

declare(strict_types=1);

final class Mappers
{
    /** @param array<string, mixed> $row */
    public static function member(array $row): array
    {
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'colorIndex' => (int) $row['color_index'],
            'team' => $row['team'],
            'createdAt' => (int) $row['created_at'],
        ];
    }

    /** @param array<string, mixed> $row */
    public static function project(array $row): array
    {
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'colorIndex' => (int) $row['color_index'],
            'sortOrder' => (int) $row['sort_order'],
            'createdAt' => (int) $row['created_at'],
        ];
    }

    /** @param array<string, mixed> $row */
    public static function task(array $row): array
    {
        return [
            'id' => $row['id'],
            'projectId' => $row['project_id'],
            'title' => $row['title'],
            'taskDescription' => $row['task_description'],
            'status' => $row['status'],
            'assigneeId' => $row['assignee_id'],
            'createdAt' => (int) $row['created_at'],
            'updatedAt' => (int) $row['updated_at'],
            'completedAt' => $row['completed_at'] !== null ? (int) $row['completed_at'] : null,
            'deadline' => $row['deadline'] !== null ? (int) $row['deadline'] : null,
            'notificationEnabled' => (int) $row['notification_enabled'] === 1,
        ];
    }
}
