<?php

declare(strict_types=1);

if ($argc < 7) {
    fwrite(STDERR, "Usage: write-php-config.php <path> <host> <db> <user> <pass> <jwt>\n");
    exit(1);
}

[, $path, $host, $name, $user, $pass, $jwt] = $argv;

$config = [
    'db' => [
        'host' => $host,
        'name' => $name,
        'user' => $user,
        'pass' => $pass,
        'charset' => 'utf8mb4',
    ],
    'jwt_secret' => $jwt,
];

$content = "<?php\nreturn " . var_export($config, true) . ";\n";
file_put_contents($path, $content);
