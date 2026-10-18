# Ezzetask

Team task board for a software company: assign work to **frontend** and **backend** teammates, organize **multiple projects**, and let **admins** track how many tasks each person completed (last 7 days, 30 days, or all time).

**Production (cPanel):** PHP + MySQL API — no Node on the server. See [docs/DEPLOY_CPANEL.md](docs/DEPLOY_CPANEL.md).

**Local dev:** PHP API + Vite React app. The legacy Node API in [`server/`](server/) is deprecated.

## Requirements

- Node.js 20+ (frontend build & dev server)
- PHP 8.1+ with PDO MySQL
- MySQL 5.7+ / MariaDB (local or cPanel)

## Run locally

**One command** (install [Node.js](https://nodejs.org) and [MySQL](https://dev.mysql.com/downloads/) first; on macOS: `brew install node php mysql` then `brew services start mysql`):

```bash
chmod +x run.sh
./run.sh
```

`run.sh` creates the local MySQL database `ezzetask_dev`, imports the schema, seeds demo data, writes `php-api/config.php`, and starts PHP + Vite.

Opens `http://localhost:5173` (Vite proxies `/api` → PHP on port 8080).

Manual:

```bash
./scripts/prepare-deploy-public.sh
php -S 127.0.0.1:8080 -t deploy/public deploy/public/router.php
# other terminal:
npm run dev
```

The app loads as **admin** automatically (no login screen). Admins see **Insights** for team completion stats.

## Build for cPanel

```bash
npm run build
```

Upload `dist/*` to `public_html/` and [`php-api/`](php-api/) to `public_html/api/` with `config.php` on the server. Full steps: [docs/DEPLOY_CPANEL.md](docs/DEPLOY_CPANEL.md).

## Features

- **Direct open** — no login screen; admin session for your team workspace
- **Projects** — create, edit, delete (admin)
- **Team** — members tagged frontend / backend / other
- **Tasks** — assignee required, status, deadline, browser notifications
- **Admin analytics** — completed tasks per person, filter by project, 7d / 30d / all time
- **Themes** — light and dark mode
