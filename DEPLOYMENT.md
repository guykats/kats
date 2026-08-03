# Deploying to Hostinger (hPanel shared/Cloud hosting)

This targets Hostinger's **hPanel-managed hosting** (shared or Cloud
plan) — not a VPS. You get SSH as a non-root user, PHP is provided via
CloudLinux's `alt-php`, there's no `apt`/root/Nginx-config access, and
document roots are fixed per-domain to `public_html/`.

## What we know about this server

- User: `u823311221` @ `de-fra-web2063`
- PHP: 8.3.30 at `/opt/alt/php83/usr/bin/php` (not on `PATH` by default)
- Composer: 2.8.11 — already installed
- Node.js: **not installed**, and there's no root to add it — frontend
  assets are built off-server (in CI) instead of on the box
- Git: available at `/usr/bin/git`
- Domain: `home.guykats.com`, webroot `domains/home.guykats.com/public_html/`
  (currently empty)
- `domains/home.guykats.com/DO_NOT_UPLOAD_HERE` is a marker Hostinger
  leaves there
- Another app already deployed on this account (`store.guykats.com`)
  uses the layout `domains/store.guykats.com/{app,public_html}` —
  this one follows the same convention

## Layout

Laravel needs its document root to be the project's `public/` folder,
but Hostinger only lets you serve `public_html/`. The fix, matching
how your other app on this account is already set up, is to put the
project in a sibling `app/` folder and make `public_html` a
**symlink** into it:

```
/home/u823311221/domains/home.guykats.com/
├── DO_NOT_UPLOAD_HERE
├── app/                     <- the Laravel project lives here
│   ├── app/
│   ├── public/
│   ├── vendor/
│   └── ...
└── public_html -> app/public   (symlink)
```

## 1. One-time manual setup (run once over SSH)

```bash
cd ~/domains/home.guykats.com
mkdir -p app
cd app
git clone https://github.com/guykats/kats.git .
git checkout main
```

`php` on this account may not resolve to 8.3 by default. Point at the
right binary:

```bash
echo 'alias php=/opt/alt/php83/usr/bin/php' >> ~/.bashrc
source ~/.bashrc
php -v   # confirm it now reports 8.3.30
```

Install PHP dependencies:

```bash
composer install --no-dev --optimize-autoloader --no-interaction
```

## 2. Create the database

In hPanel → **Databases → MySQL Databases**, create a database and
user. Hostinger auto-prefixes both with your account ID (e.g.
`u823311221_kats`). Note the host shown there — it's almost always
`localhost` for this kind of plan, but confirm on that page.

## 3. Configure `.env`

```bash
cp .env.production.example .env
nano .env
```

Fill in at minimum:

```
APP_URL=https://home.guykats.com
DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=u823311221_kats
DB_USERNAME=u823311221_kats
DB_PASSWORD=your_db_password
```

```bash
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 4. Point `public_html` at Laravel's `public/` folder

```bash
cd ~/domains/home.guykats.com
rmdir public_html   # only works while it's empty
ln -s app/public public_html
```

If that errors (not empty, or symlinks blocked on this plan), stop and
tell me what it says — the fallback is copying `public/`'s contents
into `public_html` and pointing `index.php` at the project via an
absolute path instead, which is messier to keep in sync.

## 5. Build the frontend assets (no Node on this server)

Build them somewhere that has Node — your own machine — and upload the
result:

```bash
npm ci
npm run build
scp -r public/build u823311221@de-fra-web2063:~/domains/home.guykats.com/app/public/build
```

(The GitHub Actions workflow below does this step automatically on
every deploy, so you only need to do it by hand for this first push.)

## 6. Verify

Visit `https://home.guykats.com` — you should see the Hebrew calendar.
If it doesn't load, check
`~/domains/home.guykats.com/app/storage/logs/laravel.log`.

## 7. Automated deploys via GitHub Actions

`.github/workflows/deploy.yml` mirrors the deploy pipeline already
used for `store.guykats.com` on this account, so both apps deploy the
same way. On every push to `main` (or manual "Run workflow" in the
Actions tab):

1. Builds the frontend assets in CI (since this server has no Node).
2. SSHes in, puts the app in maintenance mode, `git fetch` + `git
   reset --hard origin/main` (this repo is public, so the server
   needs no separate GitHub credential for that fetch), runs
   `composer install`, clears config, runs migrations, brings the
   site back up.
3. `scp`s the built `public/build/*` up separately, since it's
   gitignored and never touches `git`.
4. SSHes in once more to rebuild the config/route/view caches.

This only handles *updates* — steps 1–4 above still need to happen
once by hand first, so the code, `.env`, database, and the
`public_html` symlink already exist on the server, and the working
copy in `app/` is a real git clone with `origin` pointed at this repo
(`git reset --hard` requires that).

### One-time GitHub setup

1. On your own machine (not the server), generate a dedicated deploy
   key — don't reuse your personal SSH key:

   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key -N ""
   ```

2. Authorize the **public** half on the server:

   ```bash
   ssh-copy-id -i deploy_key.pub -p <ssh-port> u823311221@de-fra-web2063
   # or manually append deploy_key.pub to ~/.ssh/authorized_keys
   ```

3. In the GitHub repo, go to **Settings → Secrets and variables →
   Actions** and add (same names as the other project's workflow, for
   consistency):

   | Secret            | Value                                                        |
   | ------------------ | ------------------------------------------------------------- |
   | `SSH_HOST`         | `de-fra-web2063` (or the IP shown in hPanel → Advanced → SSH) |
   | `SSH_PORT`         | the SSH port from hPanel → Advanced → SSH Access — Hostinger shared/Cloud plans commonly use `65002`, **not** `22`; confirm there |
   | `SSH_USER`         | `u823311221`                                                   |
   | `SSH_PRIVATE_KEY`  | contents of the **private** key, `deploy_key`                 |
   | `DEPLOY_PATH`      | `/home/u823311221/domains/home.guykats.com/app`                |

   Delete `deploy_key`/`deploy_key.pub` from your machine once the
   private key is pasted into the GitHub secret.

   Note: since these are repo-scoped secrets, the values here are
   independent of whatever `SSH_HOST`/`SSH_USER`/etc. are set to in
   the *other* project's repo, even though the names match. Each
   repo's secrets only apply to that repo's workflows.

4. This workflow has no GitHub Environment protection (no required
   reviewer gate), matching the other project's setup. Add
   `environment: production` to the `deploy` job yourself later if
   you want a manual-approval step before deploys run.

## Notes

- `APP_DEBUG` must be `false` in production (already set in
  `.env.production.example`) — leaving it `true` on a public server
  prints stack traces (with your DB credentials) to visitors.
- The app doesn't dispatch queued jobs, so no queue worker/cron is
  required.
- Never commit the real `.env` — it's gitignored. Only
  `.env.production.example` (placeholder values) is tracked.
- `composer.json` pins `config.platform.php` to `8.3.30` so
  dependency resolution always targets this server's actual PHP
  version, not whatever machine happens to run `composer update`.
