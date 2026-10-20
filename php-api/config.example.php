<?php
/**
 * Production (cPanel): upload this file to public_html/api/config.php
 * and set 'pass' to your MySQL password from cPanel → MySQL Databases.
 *
 * Local dev: ./run.sh overwrites this file for ezzetask_dev automatically.
 */
return [
    'db' => [
        'host' => 'localhost',
        'name' => 'ezzetask37_turkishmedia_ezzetask',
        'user' => 'ezzetask37_ezzetask37',
        'pass' => 'V+nV)S.i-~ziiB-m',
        'charset' => 'utf8mb4',
    ],
    'jwt_secret' => 'local-dev-jwt-secret-change-in-production',
];
