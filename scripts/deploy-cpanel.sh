#!/usr/bin/env bash
# Upload php-api/, dist/, and .htaccess to cPanel from your Mac.
# Setup: cp deploy/cpanel.local.env.example deploy/cpanel.local.env && edit it
#
# Usage:
#   ./scripts/deploy-cpanel.sh api      # php-api → public_html/api/
#   ./scripts/deploy-cpanel.sh web      # dist + root .htaccess → public_html/
#   ./scripts/deploy-cpanel.sh all      # api + web

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="$ROOT/deploy/cpanel.local.env"
TARGET="${1:-all}"

load_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    echo ""
    echo "  Missing $ENV_FILE"
    echo "  cp deploy/cpanel.local.env.example deploy/cpanel.local.env"
    echo "  Then set SSH (or FTP) host, user, and paths."
    echo ""
    exit 1
  fi
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  DEPLOY_METHOD="${DEPLOY_METHOD:-ssh}"
  DEPLOY_REMOTE_PUBLIC="${DEPLOY_REMOTE_PUBLIC:-public_html}"
  DEPLOY_SSH_PORT="${DEPLOY_SSH_PORT:-22}"
  if [[ "$DEPLOY_METHOD" == "ftp" && -z "${DEPLOY_FTP_PASS:-}" ]]; then
    read -r -s -p "  FTP password (cPanel password for ${DEPLOY_FTP_USER:-user}): " DEPLOY_FTP_PASS
    echo ""
  fi
}

run_lftp() {
  local body_file
  body_file="$(mktemp)"
  trap 'rm -f "$body_file"' RETURN
  cat > "$body_file"
  export DEPLOY_FTP_HOST DEPLOY_FTP_USER DEPLOY_FTP_PASS
  if ! php "$ROOT/scripts/lftp-run.php" "$body_file"; then
    echo ""
    echo "  FTP connection failed. Check:"
    echo "    • cPanel password for ${DEPLOY_FTP_USER} (same as login)"
    echo "    • Host ${DEPLOY_FTP_HOST} (port 21, explicit FTPS)"
    echo "  Or upload via cPanel File Manager → public_html/api/"
    echo ""
    exit 1
  fi
}

remote_api_path() {
  echo "${DEPLOY_REMOTE_PUBLIC%/}/api"
}

remote_public_path() {
  echo "${DEPLOY_REMOTE_PUBLIC%/}"
}

deploy_api_ssh() {
  if [[ ! -f "$ROOT/php-api/config.php" ]]; then
    echo "  php-api/config.php is missing. Create it with your cPanel MySQL credentials first."
    exit 1
  fi
  if grep -q "ezzetask_dev" "$ROOT/php-api/config.php" 2>/dev/null; then
    echo "  Warning: config.php looks like local dev (ezzetask_dev). Use cPanel DB name/user before deploy."
    read -r -p "  Continue anyway? [y/N] " ans
    [[ "${ans:-}" =~ ^[yY]$ ]] || exit 1
  fi
  local dest="${DEPLOY_SSH_USER}@${DEPLOY_SSH_HOST}:$(remote_api_path)/"
  echo "  Uploading php-api/ → ${dest} (SSH/rsync)…"
  rsync -avz --delete \
    -e "ssh -p ${DEPLOY_SSH_PORT}" \
    --exclude '.DS_Store' \
    "$ROOT/php-api/" "$dest"
}

deploy_web_ssh() {
  if [[ ! -f "$ROOT/dist/index.html" ]]; then
    echo "  dist/ not found. Running npm run build…"
    npm run build
  fi
  local pub="$(remote_public_path)"
  echo "  Uploading dist/ → ${DEPLOY_SSH_USER}@${DEPLOY_SSH_HOST}:${pub}/ …"
  rsync -avz \
    -e "ssh -p ${DEPLOY_SSH_PORT}" \
    "$ROOT/dist/index.html" "${DEPLOY_SSH_USER}@${DEPLOY_SSH_HOST}:${pub}/"
  rsync -avz --delete \
    -e "ssh -p ${DEPLOY_SSH_PORT}" \
    "$ROOT/dist/assets/" "${DEPLOY_SSH_USER}@${DEPLOY_SSH_HOST}:${pub}/assets/"
  rsync -avz \
    -e "ssh -p ${DEPLOY_SSH_PORT}" \
    "$ROOT/deploy/public_html.htaccess" "${DEPLOY_SSH_USER}@${DEPLOY_SSH_HOST}:${pub}/.htaccess"
}

deploy_api_ftp() {
  if ! command -v lftp >/dev/null 2>&1; then
    echo "  lftp is required for FTP. Install: brew install lftp"
    exit 1
  fi
  if [[ -z "${DEPLOY_FTP_HOST:-}" || -z "${DEPLOY_FTP_USER:-}" || -z "${DEPLOY_FTP_PASS:-}" ]]; then
    echo "  Set DEPLOY_FTP_HOST, DEPLOY_FTP_USER, DEPLOY_FTP_PASS in deploy/cpanel.local.env"
    exit 1
  fi
  local remote="$(remote_api_path)"
  echo "  Connecting to ${DEPLOY_FTP_HOST} (FTPS)…"
  echo "  Uploading php-api/ → ${remote}/ …"
  run_lftp <<LFTP
mkdir -p ${remote}
lcd ${ROOT}/php-api
mirror --reverse --delete --verbose . ${remote}
LFTP
}

deploy_web_ftp() {
  if ! command -v lftp >/dev/null 2>&1; then
    echo "  lftp is required for FTP. Install: brew install lftp"
    exit 1
  fi
  if [[ ! -f "$ROOT/dist/index.html" ]]; then
    npm run build
  fi
  local pub="$(remote_public_path)"
  echo "  Connecting to ${DEPLOY_FTP_HOST} (FTPS)…"
  echo "  Uploading dist/ → ${pub}/ …"
  run_lftp <<LFTP
mkdir -p ${pub}/assets
put ${ROOT}/dist/index.html -o ${pub}/index.html
lcd ${ROOT}/dist/assets
mirror --reverse --delete --verbose . ${pub}/assets
put ${ROOT}/deploy/public_html.htaccess -o ${pub}/.htaccess
LFTP
}

run_api() {
  case "$DEPLOY_METHOD" in
    ssh) deploy_api_ssh ;;
    ftp) deploy_api_ftp ;;
    *)
      echo "  Unknown DEPLOY_METHOD=$DEPLOY_METHOD (use ssh or ftp)"
      exit 1
      ;;
  esac
}

run_web() {
  case "$DEPLOY_METHOD" in
    ssh) deploy_web_ssh ;;
    ftp) deploy_web_ftp ;;
    *)
      echo "  Unknown DEPLOY_METHOD=$DEPLOY_METHOD (use ssh or ftp)"
      exit 1
      ;;
  esac
}

load_env

case "$TARGET" in
  api)
    run_api
    echo "  Done. Test: https://YOUR_DOMAIN/api/health"
    ;;
  web)
    run_web
    echo "  Done. Open https://YOUR_DOMAIN"
    ;;
  all)
    run_api
    run_web
    echo "  Done. Seed once: https://YOUR_DOMAIN/api/seed.php then delete seed.php"
    ;;
  *)
    echo "Usage: $0 api|web|all"
    exit 1
    ;;
esac
