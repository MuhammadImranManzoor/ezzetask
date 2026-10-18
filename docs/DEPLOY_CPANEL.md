# Deploy Ezzetask to cPanel (PHP + MySQL)

No Node.js required on the server.

## 1. MySQL database

1. cPanel → **MySQL Databases**
2. Create database (e.g. `username_ezzetask`)
3. Create user with strong password
4. **Add user to database** with **ALL PRIVILEGES**
5. phpMyAdmin → select database → **Import** → [`php-api/schema.sql`](../php-api/schema.sql)

## 2. Configure API

1. Copy [`php-api/config.example.php`](../php-api/config.example.php) to `config.php` on the server
2. Set `host` (usually `localhost`), `name`, `user`, `pass`, and a long random `jwt_secret`
3. Upload the entire [`php-api/`](../php-api/) folder to `public_html/api/`
4. Ensure `config.php` is **not** publicly readable (`.htaccess` blocks direct access)

### Upload from your Mac (script)

If cPanel **SSH Access** is enabled (best):

```bash
cp deploy/cpanel.local.env.example deploy/cpanel.local.env
# Edit deploy/cpanel.local.env — host, username, port

chmod +x scripts/deploy-cpanel.sh
./scripts/deploy-cpanel.sh api    # only php-api → public_html/api/
./scripts/deploy-cpanel.sh web    # dist + .htaccess → public_html/
./scripts/deploy-cpanel.sh all    # API + frontend
```

First time SSH: use your cPanel password, or add your Mac’s public key in cPanel → **SSH Access → Manage SSH Keys**.

**FTP only:** set `DEPLOY_METHOD=ftp` and FTP fields in `cpanel.local.env`, then `brew install lftp` and run the same commands.

Manual upload: cPanel **File Manager** → `public_html/api/` (same result as the script).

### Option B — File Manager only (GoDaddy / no SSH shell)

Do **not** run `./scripts/deploy-cpanel.sh` if SSH says *Shell access is not enabled* or *Permission denied (publickey)*.

On your Mac:

```bash
chmod +x scripts/package-for-cpanel.sh
./scripts/package-for-cpanel.sh
```

This creates **`deploy/upload-zips/ezzetask-api.zip`** and **`ezzetask-web.zip`**.

In cPanel **File Manager**:

1. Go to **`public_html`** → create folder **`api`** if needed.
2. Enter **`api`** → **Upload** `ezzetask-api.zip` → **Extract** (you should see `index.php`, `config.php`, `lib/`, etc. inside `api/`, not a nested `php-api` folder).
3. Back to **`public_html`** → **Upload** `ezzetask-web.zip` → **Extract** (`index.html`, `assets/`, `.htaccess`).
4. If `.htaccess` is named `public_html.htaccess`, rename it to **`.htaccess`** in `public_html`.
5. Visit `/api/seed.php` once, then **delete** `seed.php`.

## 3. Seed demo data (once)

Open in browser:

`https://yourdomain.com/api/seed.php`

When you see “Seeded…”, **delete `seed.php`** from the server.

## 4. Build and upload frontend

On your computer:

```bash
npm install
npm run build
```

Upload **contents** of `dist/` to `public_html/`:

- `index.html`
- `assets/`

Do **not** set `VITE_API_URL` unless the API is on another domain.

## 5. Root `.htaccess`

Copy [`deploy/public_html.htaccess`](../deploy/public_html.htaccess) to `public_html/.htaccess`.

## 6. SSL

cPanel → **SSL/TLS** → Let’s Encrypt for your domain.

## 7. Smoke test

- `https://yourdomain.com/api/health` → `{"ok":true}`
- `POST /api/auth/session` (or load the app) — must not be 500/503
- Open `https://yourdomain.com` → workspace loads with projects/tasks

### “Could not start workspace”

Usually **`api/config.php` MySQL settings** or **database not seeded**.

1. In cPanel → **MySQL Databases**, copy the **full** database name and **full** MySQL username (e.g. `ezzetask37_myuser`, not just `ezzetask37`).
2. Edit **`public_html/api/config.php`** on the server (`host` = `localhost`, correct `name`, `user`, `pass`).
3. phpMyAdmin: confirm tables exist (import `schema.sql` if empty).
4. Visit **`https://yourdomain.com/api/seed.php`** once, then delete `seed.php`.
5. Rebuild/re-upload only if you changed the frontend error text locally.

## Local development (PHP + Vite)

See root [README.md](../README.md). Uses `./run.sh` with PHP on port 8080 and Vite on 5173.

## Backup

Regularly download a **phpMyAdmin export** of your MySQL database.
