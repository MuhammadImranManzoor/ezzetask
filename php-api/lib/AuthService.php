<?php

declare(strict_types=1);

final class AuthService
{
    /** @param array{id: string, email: string, role: string, member_id: ?string} $user */
    public static function sessionForUser(array $user): array
    {
        $pdo = Database::pdo();
        $member = null;
        if ($user['member_id'] !== null) {
            $stmt = $pdo->prepare('SELECT * FROM members WHERE id = ?');
            $stmt->execute([$user['member_id']]);
            $row = $stmt->fetch();
            if ($row) {
                $member = Mappers::member($row);
            }
        }
        $token = Auth::signToken([
            'userId' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'memberId' => $user['member_id'],
        ]);
        return [
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'memberId' => $user['member_id'],
                'member' => $member,
            ],
        ];
    }
}
