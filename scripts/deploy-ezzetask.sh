#!/usr/bin/env bash
# One command: build + upload API + frontend to ezzetask.com (FTP). Prompts for cPanel/FTP password.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
chmod +x "$ROOT/scripts/deploy-cpanel.sh"
exec "$ROOT/scripts/deploy-cpanel.sh" all
