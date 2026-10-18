<?php

declare(strict_types=1);

final class Auth
{
    /** @var array<string, mixed>|null */
    public static ?array $payload = null;

    public static function secret(): string
    {
        $config = require dirname(__DIR__) . '/config.php';
        return $config['jwt_secret'] ?? 'dev-only-change-me';
    }

    /** @param array{userId: string, email: string, role: string, memberId: ?string} $payload */
    public static function signToken(array $payload): string
    {
        $header = self::b64url(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $now = time();
        $body = [
            'userId' => $payload['userId'],
            'email' => $payload['email'],
            'role' => $payload['role'],
            'memberId' => $payload['memberId'],
            'iat' => $now,
            'exp' => $now + 14 * 24 * 3600,
        ];
        $payloadPart = self::b64url(json_encode($body));
        $sig = self::b64url(hash_hmac('sha256', "$header.$payloadPart", self::secret(), true));
        return "$header.$payloadPart.$sig";
    }

    public static function verifyBearer(?string $header): ?array
    {
        if ($header === null || !str_starts_with($header, 'Bearer ')) {
            return null;
        }
        $token = trim(substr($header, 7));
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$h, $p, $s] = $parts;
        $expected = self::b64url(hash_hmac('sha256', "$h.$p", self::secret(), true));
        if (!hash_equals($expected, $s)) {
            return null;
        }
        $json = json_decode(self::b64urlDecode($p), true);
        if (!is_array($json) || ($json['exp'] ?? 0) < time()) {
            return null;
        }
        return $json;
    }

    public static function bearerHeader(): ?string
    {
        $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
        if ($auth !== null && $auth !== '') {
            return $auth;
        }
        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            foreach ($headers as $key => $value) {
                if (strtolower((string) $key) === 'authorization') {
                    return (string) $value;
                }
            }
        }
        if (function_exists('getallheaders')) {
            foreach (getallheaders() as $key => $value) {
                if (strtolower((string) $key) === 'authorization') {
                    return (string) $value;
                }
            }
        }
        $raw = $_SERVER['HTTP_X_EZZETASK_TOKEN'] ?? null;
        if ($raw !== null && $raw !== '') {
            return 'Bearer ' . trim((string) $raw);
        }
        return null;
    }

    public static function requireAuth(): bool
    {
        $payload = self::verifyBearer(self::bearerHeader());
        if ($payload === null) {
            Response::error('Unauthorized', 401);
            return false;
        }
        self::$payload = $payload;
        return true;
    }

    public static function requireAdmin(): bool
    {
        if (!self::requireAuth()) {
            return false;
        }
        if ((self::$payload['role'] ?? '') !== 'admin') {
            Response::error('Admin access required', 403);
            return false;
        }
        return true;
    }

    private static function b64url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function b64urlDecode(string $data): string
    {
        $pad = 4 - (strlen($data) % 4);
        if ($pad < 4) {
            $data .= str_repeat('=', $pad);
        }
        return base64_decode(strtr($data, '-_', '+/')) ?: '';
    }
}
