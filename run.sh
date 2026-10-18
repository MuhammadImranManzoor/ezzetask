#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install it from https://nodejs.org"
  exit 1
fi

if ! command -v php >/dev/null 2>&1; then
  echo "PHP 8.1+ is required for the API."
  echo "  macOS: brew install php"
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "Installing frontend dependencies…"
  npm install
fi

chmod +x scripts/ensure-local-dev.sh scripts/prepare-deploy-public.sh
./scripts/ensure-local-dev.sh
./scripts/prepare-deploy-public.sh

PORT="${PORT:-5173}"
API_PORT="${API_PORT:-8080}"
URL="http://localhost:${PORT}"

echo ""
echo "  Ezzetask API (PHP) → http://127.0.0.1:${API_PORT}/api/health"
echo "  Ezzetask app       → ${URL}"
echo "  Opens directly — no sign-in screen"
echo "  Press Ctrl+C to stop"
echo ""

cleanup() {
  kill "$API_PID" "$WEB_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

php -S "127.0.0.1:${API_PORT}" -t deploy/public deploy/public/router.php &
API_PID=$!

for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf "http://127.0.0.1:${API_PORT}/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.3
done

npm run dev -- --host "127.0.0.1" --port "${PORT}" &
WEB_PID=$!

if [[ "$(uname -s)" == "Darwin" ]]; then
  (sleep 2 && open "${URL}") >/dev/null 2>&1 &
fi

wait "$WEB_PID"
