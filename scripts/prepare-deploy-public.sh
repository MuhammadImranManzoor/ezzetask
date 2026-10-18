#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mkdir -p "$ROOT/deploy/public"
rsync -a --delete \
  --exclude 'config.php' \
  "$ROOT/php-api/" "$ROOT/deploy/public/api/"
if [[ -f "$ROOT/php-api/config.php" ]]; then
  cp "$ROOT/php-api/config.php" "$ROOT/deploy/public/api/config.php"
fi
if [[ -f "$ROOT/dist/index.html" ]]; then
  cp "$ROOT/dist/index.html" "$ROOT/deploy/public/"
  rm -rf "$ROOT/deploy/public/assets"
  cp -R "$ROOT/dist/assets" "$ROOT/deploy/public/"
fi
