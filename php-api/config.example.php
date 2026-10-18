<?php
/**
 * Copy to config.php and fill in your cPanel MySQL credentials.
 * Do not commit config.php.
 */
return [
    'db' => [
        'host' => 'localhost',
        'name' => 'cpanel_user_ezzetask',
        // Full MySQL username from cPanel → MySQL Databases (NOT your cPanel login name)
        'user' => 'cpanel_user_dbuser',
        'pass' => 'your_mysql_password',
        'charset' => 'utf8mb4',
    ],
    'jwt_secret' => 'change-this-to-a-long-random-string-in-production',
];
