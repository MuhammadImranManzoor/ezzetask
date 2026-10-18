<?php

declare(strict_types=1);

/**
 * Run once after importing schema.sql. Delete this file on production after seeding.
 */

require __DIR__ . '/bootstrap.php';

header('Content-Type: text/plain; charset=utf-8');

$pdo = Database::pdo();
$count = (int) $pdo->query('SELECT COUNT(*) FROM members')->fetchColumn();
if ($count > 0) {
    echo "Database already seeded.\n";
    exit;
}

$now = (int) (microtime(true) * 1000);
$day = 24 * 60 * 60 * 1000;

function insertMember(PDO $pdo, string $id, string $name, string $team, int $color, int $createdAt): void
{
    $pdo->prepare(
        'INSERT INTO members (id, name, color_index, team, created_at) VALUES (?, ?, ?, ?, ?)',
    )->execute([$id, $name, $color, $team, $createdAt]);
}

$memberIds = [
    uuid_v4(),
    uuid_v4(),
    uuid_v4(),
    uuid_v4(),
];
$memberMeta = [
    ['Alex (FE)', 'frontend', 1],
    ['Sam (FE)', 'frontend', 2],
    ['Jordan (BE)', 'backend', 3],
    ['Riley (BE)', 'backend', 4],
];
foreach ($memberMeta as $i => [$name, $team, $color]) {
    insertMember($pdo, $memberIds[$i], $name, $team, $color, $now);
}

$projects = [
    ['Client Portal', 1, 0],
    ['Mobile App', 2, 1],
    ['Internal Tools', 4, 2],
];
$projectIds = [];
foreach ($projects as [$name, $color, $sort]) {
    $id = uuid_v4();
    $projectIds[] = $id;
    $pdo->prepare(
        'INSERT INTO projects (id, name, color_index, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
    )->execute([$id, $name, $color, $sort, $now]);
}

$sampleTasks = [
    ['Dashboard layout polish', 0, 0, 'done', 2],
    ['Auth token refresh', 2, 0, 'inProgress', 0],
    ['Push notification hook', 1, 1, 'todo', 0],
    ['Reporting API endpoints', 3, 2, 'done', 5],
    ['Migrate legacy users', 2, 2, 'done', 12],
];

$insTask = $pdo->prepare(
    'INSERT INTO tasks (id, project_id, title, task_description, status, assignee_id, created_at, updated_at, completed_at, deadline, notification_enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
);

foreach ($sampleTasks as [$title, $memberIdx, $projIdx, $status, $daysAgo]) {
    $created = $now - $daysAgo * $day;
    $completed = $status === 'done' ? $created + 6 * 60 * 60 * 1000 : null;
    $insTask->execute([
        uuid_v4(),
        $projectIds[$projIdx],
        $title,
        '',
        $status,
        $memberIds[$memberIdx],
        $created,
        $completed ?? $created,
        $completed,
        null,
        1,
    ]);
}

$hash = password_hash('unused', PASSWORD_BCRYPT);
$pdo->prepare(
    'INSERT INTO users (id, email, password_hash, role, member_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
)->execute([uuid_v4(), 'admin@ezzetask.local', $hash, 'admin', null, $now]);
$pdo->prepare(
    'INSERT INTO users (id, email, password_hash, role, member_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
)->execute([uuid_v4(), 'alex@ezzetask.local', $hash, 'member', $memberIds[0], $now]);

echo "Seeded demo team, projects, and tasks.\n";
