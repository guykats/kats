# Deploying to a Hostinger VPS (MySQL)

Assumes a Hostinger VPS/Cloud plan (Ubuntu, root SSH access) and a MySQL
database you've already created (via hPanel's Databases section, or your
own MySQL server on the VPS). You'll need: the DB host/name/user/password,
SSH access to the VPS, and a domain pointed at the VPS's IP.

## 1. Install server dependencies

SSH into the VPS, then:

```bash
apt update && apt upgrade -y
apt install -y nginx mysql-client git unzip

# PHP 8.3+ with the extensions Laravel needs
apt install -y php8.3-fpm php8.3-cli php8.3-mysql php8.3-mbstring \
  php8.3-xml php8.3-curl php8.3-zip php8.3-bcmath php8.3-gd

# Composer
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer

# Node.js (for building the frontend assets)
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs
```

If your DB is a Hostinger *managed* database rather than one on this VPS,
skip installing a MySQL server — you already have `DB_HOST`.

## 2. Get the code onto the server

```bash
mkdir -p /var/www/kats
cd /var/www/kats
git clone https://github.com/guykats/kats.git .
git checkout main   # or whichever branch you're deploying
```

## 3. Configure the environment

```bash
cp .env.production.example .env
nano .env   # fill in APP_URL and the real DB_* credentials from hPanel
php artisan key:generate
```

Set at minimum:

```
APP_URL=https://your-domain.com
DB_CONNECTION=mysql
DB_HOST=127.0.0.1        # or the managed DB host Hostinger gave you
DB_PORT=3306
DB_DATABASE=your_db_name
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
```

## 4. Install dependencies, build, migrate

```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build

php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 5. Permissions

```bash
chown -R www-data:www-data /var/www/kats
chmod -R 775 storage bootstrap/cache
```

## 6. Nginx vhost

The document root must be the `public/` folder, not the repo root.

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/kats/public;

    index index.php;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Save as `/etc/nginx/sites-available/kats`, then:

```bash
ln -s /etc/nginx/sites-available/kats /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## 7. HTTPS

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

## 8. Redeploying after changes

```bash
cd /var/www/kats
git pull
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
```

## 9. Automated deploys via GitHub Actions

`.github/workflows/deploy.yml` runs the test suite, then (only if it
passes) SSHes into the VPS and runs the same steps as "Redeploying
after changes" above, every time `main` is pushed to (or via manual
"Run workflow" from the Actions tab).

This only handles *updates* — you still need to have done steps 1–7
once by hand so the code, `.env`, and Nginx vhost already exist on
the server.

### One-time setup

1. On your machine (not the server), generate a dedicated deploy key
   — don't reuse your personal SSH key:

   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key -N ""
   ```

2. Authorize the **public** half on the VPS, for the user that owns
   `/var/www/kats`:

   ```bash
   ssh-copy-id -i deploy_key.pub deploy-user@your-server-ip
   # or manually append deploy_key.pub to ~deploy-user/.ssh/authorized_keys
   ```

3. In the GitHub repo, go to **Settings → Secrets and variables →
   Actions** and add:

   | Secret                  | Value                                            |
   | ------------------------ | ------------------------------------------------ |
   | `HOSTINGER_SSH_HOST`     | VPS IP or hostname                                |
   | `HOSTINGER_SSH_USER`     | the deploy user (e.g. `root` or `deploy-user`)    |
   | `HOSTINGER_SSH_KEY`      | contents of the **private** key, `deploy_key`     |
   | `HOSTINGER_SSH_PORT`     | optional, defaults to `22`                        |
   | `HOSTINGER_DEPLOY_PATH`  | e.g. `/var/www/kats`                              |

   Delete `deploy_key`/`deploy_key.pub` from your machine once the
   private key is pasted into the GitHub secret.

4. Optional but recommended: create a **production** environment
   under **Settings → Environments** and add yourself as a required
   reviewer, so every deploy needs a manual approval click before it
   runs.

## Notes

- `APP_DEBUG` must be `false` in production (already set in
  `.env.production.example`) — leaving it `true` on a public
  server prints stack traces (with your DB credentials) to visitors.
- The app doesn't dispatch queued jobs, so no queue worker is required.
- Never commit the real `.env` — it's gitignored. Only
  `.env.production.example` (placeholder values) is tracked.
