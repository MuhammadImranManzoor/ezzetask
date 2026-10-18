<?php

declare(strict_types=1);

final class AuthHandler
{
    public static function session(): void
    {
        $pdo = Database::pdo();
        $stmt = $pdo->query(
            "SELECT id, email, role, member_id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1",
        );
        $user = $stmt->fetch();
        if (!$user) {
            Response::error('No admin account configured. Run seed.', 503);
            return;
        }
        Response::json(AuthService::sessionForUser($user));
    }

    public static function login(): void
    {
        $body = json_body();
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        if ($email === '') {
            Response::error('Email required', 400);
            return;
        }
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id, email, role, member_id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if (!$user) {
            Response::error('No account for this email', 401);
            return;
        }
        Response::json(AuthService::sessionForUser($user));
    }

    public static function me(): void
    {
        if (!Auth::requireAuth()) {
            return;
        }
        $userId = Auth::$payload['userId'] ?? '';
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id, email, role, member_id FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        if (!$user) {
            Response::error('User not found', 401);
            return;
        }
        $member = null;
        if ($user['member_id'] !== null) {
            $m = $pdo->prepare('SELECT * FROM members WHERE id = ?');
            $m->execute([$user['member_id']]);
            $row = $m->fetch();
            if ($row) {
                $member = Mappers::member($row);
            }
        }
        Response::json([
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'memberId' => $user['member_id'],
                'member' => $member,
            ],
        ]);
    }
}
