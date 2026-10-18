<?php

declare(strict_types=1);

final class AnalyticsHandler
{
    private static function periodStart(string $period): ?int
    {
        $now = (int) (microtime(true) * 1000);
        if ($period === '7d') {
            return $now - 7 * 24 * 60 * 60 * 1000;
        }
        if ($period === '30d') {
            return $now - 30 * 24 * 60 * 60 * 1000;
        }
        return null;
    }

    public static function productivity(): void
    {
        if (!Auth::requireAdmin()) {
            return;
        }
        $period = $_GET['period'] ?? '7d';
        if (!in_array($period, ['7d', '30d', 'all'], true)) {
            Response::error('Invalid period', 400);
            return;
        }
        $projectId = isset($_GET['projectId']) && $_GET['projectId'] !== ''
            ? (string) $_GET['projectId']
            : null;
        $since = self::periodStart($period);
        $pdo = Database::pdo();

        $members = $pdo->query('SELECT id, name, team, color_index FROM members ORDER BY name')->fetchAll();

        $openSql = 'SELECT assignee_id, status, COUNT(*) as c FROM tasks WHERE assignee_id IS NOT NULL';
        $openParams = [];
        if ($projectId !== null) {
            $openSql .= ' AND project_id = ?';
            $openParams[] = $projectId;
        }
        $openSql .= ' GROUP BY assignee_id, status';
        $openStmt = $pdo->prepare($openSql);
        $openStmt->execute($openParams);
        $openCounts = $openStmt->fetchAll();

        $completedSql = "SELECT assignee_id, COUNT(*) as completed FROM tasks WHERE status = 'done' AND assignee_id IS NOT NULL";
        $completedParams = [];
        if ($projectId !== null) {
            $completedSql .= ' AND project_id = ?';
            $completedParams[] = $projectId;
        }
        if ($since !== null) {
            $completedSql .= ' AND completed_at IS NOT NULL AND completed_at >= ?';
            $completedParams[] = $since;
        }
        $completedSql .= ' GROUP BY assignee_id';
        $completedStmt = $pdo->prepare($completedSql);
        $completedStmt->execute($completedParams);
        $completedInPeriod = $completedStmt->fetchAll();

        $byMember = [];
        foreach ($members as $m) {
            $open = ['todo' => 0, 'inProgress' => 0, 'done' => 0];
            foreach ($openCounts as $row) {
                if ($row['assignee_id'] !== $m['id']) {
                    continue;
                }
                if ($row['status'] === 'todo') {
                    $open['todo'] = (int) $row['c'];
                }
                if ($row['status'] === 'inProgress') {
                    $open['inProgress'] = (int) $row['c'];
                }
                if ($row['status'] === 'done') {
                    $open['done'] = (int) $row['c'];
                }
            }
            $completed = 0;
            foreach ($completedInPeriod as $c) {
                if ($c['assignee_id'] === $m['id']) {
                    $completed = (int) $c['completed'];
                }
            }
            $byMember[] = [
                'memberId' => $m['id'],
                'name' => $m['name'],
                'team' => $m['team'],
                'colorIndex' => (int) $m['color_index'],
                'openTodo' => $open['todo'],
                'openInProgress' => $open['inProgress'],
                'openDone' => $open['done'],
                'completedInPeriod' => $completed,
            ];
        }

        $teamTotals = [
            'frontend' => ['completed' => 0, 'open' => 0, 'members' => 0],
            'backend' => ['completed' => 0, 'open' => 0, 'members' => 0],
            'other' => ['completed' => 0, 'open' => 0, 'members' => 0],
        ];
        foreach ($byMember as $row) {
            $team = $row['team'];
            if (!isset($teamTotals[$team])) {
                $team = 'other';
            }
            $teamTotals[$team]['members'] += 1;
            $teamTotals[$team]['completed'] += $row['completedInPeriod'];
            $teamTotals[$team]['open'] += $row['openTodo'] + $row['openInProgress'];
        }

        $joinSince = '';
        $projParams = [];
        if ($since !== null) {
            $joinSince = ' AND t.completed_at IS NOT NULL AND t.completed_at >= ?';
            $projParams[] = $since;
        }
        $projSql = "SELECT p.id, p.name, COUNT(t.id) as completed FROM projects p
            LEFT JOIN tasks t ON t.project_id = p.id AND t.status = 'done' AND t.assignee_id IS NOT NULL{$joinSince}
            GROUP BY p.id ORDER BY p.sort_order";
        $projStmt = $pdo->prepare($projSql);
        $projStmt->execute($projParams);
        $projectBreakdown = $projStmt->fetchAll();

        Response::json([
            'period' => $period,
            'projectId' => $projectId,
            'generatedAt' => (int) (microtime(true) * 1000),
            'summary' => [
                'completedInPeriod' => array_sum(array_column($byMember, 'completedInPeriod')),
                'openTasks' => array_sum(array_map(
                    fn ($m) => $m['openTodo'] + $m['openInProgress'],
                    $byMember,
                )),
                'teamTotals' => $teamTotals,
            ],
            'members' => $byMember,
            'byProject' => array_map(
                fn ($p) => [
                    'projectId' => $p['id'],
                    'projectName' => $p['name'],
                    'completedInPeriod' => (int) $p['completed'],
                ],
                $projectBreakdown,
            ),
        ]);
    }
}
