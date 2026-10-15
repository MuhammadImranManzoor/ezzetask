#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install it from https://nodejs.org"
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies…"
  npm install
fi

PORT="${PORT:-5173}"
URL="http://localhost:${PORT}"

echo ""
echo "  Turkish Media → ${URL}"
echo "  Press Ctrl+C to stop"
echo ""

if [[ "$(uname -s)" == "Darwin" ]]; then
  (sleep 1.5 && open "${URL}") >/dev/null 2>&1 &
fi

exec npm run dev -- --host "127.0.0.1" --port "${PORT}"
