#!/usr/bin/env bash
# Creates local MySQL database, schema, seed data, and php-api/config.php for ./run.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DB_NAME="${EZZETASK_DB_NAME:-ezzetask_dev}"
MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_PASS="${MYSQL_PASSWORD:-}"
JWT_SECRET="${EZZETASK_JWT_SECRET:-local-dev-jwt-secret-change-in-production}"

mysql_cmd() {
  if [[ -n "$MYSQL_PASS" ]]; then
    mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASS" "$@"
  else
    mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" "$@"
  fi
}

mysqladmin_cmd() {
  if [[ -n "$MYSQL_PASS" ]]; then
    mysqladmin -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASS" "$@"
  else
    mysqladmin -h "$MYSQL_HOST" -u "$MYSQL_USER" "$@"
  fi
}

mysql_ping() {
  mysqladmin_cmd ping --silent 2>/dev/null
}

start_mysql_service() {
  if mysql_ping; then
    return 0
  fi
  if [[ "$MYSQL_HOST" == "127.0.0.1" ]]; then
    MYSQL_HOST=localhost
    if mysql_ping; then
      return 0
    fi
    MYSQL_HOST=127.0.0.1
  fi
  if [[ "$(uname -s)" != "Darwin" ]] || ! command -v brew >/dev/null 2>&1; then
    return 1
  fi
  echo "  MySQL not running — trying Homebrew services…"
  for svc in mysql mysql@8.4 mysql@8.0 mariadb; do
    if brew services start "$svc" 2>/dev/null; then
      sleep 3
      mysql_ping && return 0
    fi
  done
  return 1
}

write_config() {
  php "$ROOT/scripts/write-php-config.php" \
    "$ROOT/php-api/config.php" \
    "$MYSQL_HOST" \
    "$DB_NAME" \
    "$MYSQL_USER" \
    "$MYSQL_PASS" \
    "$JWT_SECRET"
}

if ! command -v mysql >/dev/null 2>&1; then
  echo ""
  echo "  MySQL client not found."
  echo "  macOS: brew install mysql && brew services start mysql"
  echo "  Then run ./run.sh again."
  echo ""
  exit 1
fi

if ! start_mysql_service; then
  echo ""
  echo "  Could not connect to MySQL on ${MYSQL_HOST} as ${MYSQL_USER}."
  echo "  Start MySQL, or set MYSQL_HOST / MYSQL_USER / MYSQL_PASSWORD and retry."
  echo ""
  exit 1
fi

echo "  Preparing local database «${DB_NAME}»…"

mysql_cmd -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

needs_schema=0
if ! mysql_cmd "$DB_NAME" -e "SELECT 1 FROM members LIMIT 1" >/dev/null 2>&1; then
  needs_schema=1
fi

if [[ "$needs_schema" -eq 1 ]]; then
  mysql_cmd "$DB_NAME" < "$ROOT/php-api/schema.sql"
fi

member_count="$(mysql_cmd "$DB_NAME" -Nse "SELECT COUNT(*) FROM members" 2>/dev/null || echo 0)"
if [[ "${member_count:-0}" -eq 0 ]]; then
  (cd "$ROOT/php-api" && php seed.php)
fi

write_config
echo "  Local API config written to php-api/config.php"
