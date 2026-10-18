#!/usr/bin/env bash
# Option B: zip files for cPanel File Manager (no SSH/FTP script needed).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OUT="$ROOT/deploy/upload-zips"
mkdir -p "$OUT"

if [[ ! -f php-api/config.php ]]; then
  echo "  Missing php-api/config.php — add cPanel MySQL credentials first."
  exit 1
fi

echo "  Building frontend…"
npm run build --silent 2>/dev/null || npm run build

API_ZIP="$OUT/ezzetask-api.zip"
WEB_ZIP="$OUT/ezzetask-web.zip"

rm -f "$API_ZIP" "$WEB_ZIP"
( cd php-api && zip -rq "$API_ZIP" . -x '*.DS_Store' )
TMPWEB="$(mktemp -d)"
cp -R dist/index.html dist/assets "$TMPWEB/"
cp deploy/public_html.htaccess "$TMPWEB/.htaccess"
( cd "$TMPWEB" && zip -rq "$WEB_ZIP" . )
rm -rf "$TMPWEB"

echo ""
echo "  Created:"
echo "    $API_ZIP"
echo "    $WEB_ZIP"
echo ""
echo "  cPanel File Manager:"
echo "    1. public_html → create folder api (if missing)"
echo "    2. Open api → Upload ezzetask-api.zip → Extract (files directly in api/)"
echo "    3. Open public_html → Upload ezzetask-web.zip → Extract"
echo "    4. Confirm public_html has .htaccess (from ezzetask-web.zip)"
echo "    5. Browser: https://ezzetask.com/api/health then /api/seed.php (delete seed.php after)"
echo ""
