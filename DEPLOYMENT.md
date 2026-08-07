# Deploying to Hostinger (hPanel shared/Cloud hosting)

## Quick reference (exact paths — don't re-derive these)

| What | Value |
| --- | --- |
| SSH | `ssh -p 65002 u823311221@82.198.227.90` |
| App path (git working copy) | `/home/u823311221/domains/home.guykats.com/app` |
| Webroot symlink | `/home/u823311221/domains/home.guykats.com/public_html` → `app/public` |
| PHP binary | `/opt/alt/php83/usr/bin/php` (not on `PATH` by default) |
| Server's checked-out branch | `deploy` (not `main` — see "Automated deploys" below) |
| Pull-deploy script | `/home/u823311221/domains/home.guykats.com/app/deploy/pull-deploy.sh` |
| Deploy log | `/home/u823311221/deploy.log` |
| Cron trigger | hPanel → **Advanced → Cron Jobs** (SSH `crontab` doesn't persist on this plan) |
| Cron command | `/bin/bash /home/u823311221/domains/home.guykats.com/app/deploy/pull-deploy.sh >> /home/u823311221/deploy.log 2>&1` |
| DB | MySQL, `u823311221_kats` (host `localhost`) |

This targets Hostinger's **hPanel-managed hosting** (shared or Cloud
plan) — not a VPS. You get SSH as a non-root user, PHP is provided via
CloudLinux's `alt-php`, there's no `apt`/root/Nginx-config access, and
document roots are fixed per-domain to `public_html/`.

## What we know about this server

- User: `u823311221` @ `82.198.227.90`, port `65002` (the shell prompt
  shows `de-fra-web2063`, but that's an internal hostname — it's not
  publicly resolvable, so external tools like GitHub Actions need the
  IP instead)
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
scp -P 65002 -r public/build u823311221@82.198.227.90:~/domains/home.guykats.com/app/public/build
```

(The GitHub Actions workflow below does this step automatically on
every deploy, so you only need to do it by hand for this first push.)

## 6. Verify

Visit `https://home.guykats.com` — you should see the Hebrew calendar.
If it doesn't load, check
`~/domains/home.guykats.com/app/storage/logs/laravel.log`.

## 7. Automated deploys: CI builds, a server-side cron pulls

**This changed from the original SSH-push design.** GitHub Actions
used to SSH into the server directly on every push. That started
failing permanently with a TCP dial timeout — Hostinger's shared
hosting silently drops inbound connections from cloud-datacenter IP
ranges (GitHub Actions runs on Azure), and that isn't something
togglable from either side. So the direction was flipped: **the
server pulls, GitHub never connects in.**

`.github/workflows/deploy.yml` now has one job, `build-and-push`, on
every push to `main`:

1. Builds the frontend assets in CI (`npm ci && npm run build`) —
   still no Node on the server.
2. `git add -f public/build` (normally gitignored) and commits +
   force-pushes the result to a `deploy` branch on this repo, over
   plain HTTPS. Needs `permissions: contents: write` in the workflow —
   the default `GITHUB_TOKEN` is read-only otherwise (403 on push).

On the server, `deploy/pull-deploy.sh` (see paths in the Quick
reference table at the top of this file) runs on a schedule via
**hPanel's Cron Jobs UI** — not SSH `crontab`, which doesn't persist
edits on this shared-hosting plan. Each run:

1. `git fetch origin deploy`, compares to local `HEAD`. Exits
   immediately (no-op) if nothing changed — cheap to run every minute.
2. If there's a new commit: maintenance mode → `git reset --hard
   origin/deploy` (this repo is public, so no GitHub credential is
   needed on the server for the fetch) → `composer install` →
   `migrate --force` → rebuild config/route/view caches → maintenance
   mode off.

The server's working copy tracks the **`deploy`** branch, not `main` —
`main` only exists to trigger CI; the actual deployed code (plus
built assets) lives on `deploy`.

This only handles *updates*. The one-time manual setup (steps 1–6
above) still needs to happen first by hand, so `.env`, the database,
and the `public_html` symlink already exist — then point the git
remote's tracked branch at `deploy` instead of `main`:

```bash
cd ~/domains/home.guykats.com/app
git fetch origin
git checkout -B deploy origin/deploy
chmod +x deploy/pull-deploy.sh
```

### Debugging a stalled deploy

If a push doesn't show up live after a few minutes:

1. `cat ~/deploy.log` — empty/missing means cron never fired (check
   the hPanel Cron Jobs entry exists and matches the Quick reference
   command exactly); a `deploying <sha>` with no matching `deployed
   <sha>` means the script died mid-run — look at the command output
   right above it for which step failed.
2. Run the script directly over SSH to isolate "cron isn't firing"
   from "the script itself is broken":
   ```bash
   /bin/bash ~/domains/home.guykats.com/app/deploy/pull-deploy.sh
   echo "exit code: $?"
   ```
3. Check the GitHub Actions run for the `build-and-push` job actually
   succeeded and pushed to `deploy` — if CI never ran or failed, the
   server has nothing new to pull regardless of the cron.

## Notes

- `APP_DEBUG` must be `false` in production (already set in
  `.env.production.example`) — leaving it `true` on a public server
  prints stack traces (with your DB credentials) to visitors.
- The app doesn't dispatch queued jobs, so no Laravel queue worker is
  needed — the only cron job is the deploy puller above.
- Never commit the real `.env` — it's gitignored. Only
  `.env.production.example` (placeholder values) is tracked.
- `composer.json` pins `config.platform.php` to `8.3.30` so
  dependency resolution always targets this server's actual PHP
  version, not whatever machine happens to run `composer update`.
- The GitHub repo secrets `SSH_HOST`/`SSH_PORT`/`SSH_USER`/
  `SSH_PRIVATE_KEY`/`DEPLOY_PATH` are **no longer used** by
  `deploy.yml` since the switch to the pull-based model (section 7) —
  they're harmless to leave in place but can be deleted.
