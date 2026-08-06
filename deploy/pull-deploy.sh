#!/usr/bin/env bash
# Cron-driven pull deploy. Runs on the server; never accepts an inbound
# connection from GitHub, so it works even when Hostinger blocks SSH
# from GitHub Actions' cloud IP ranges. Compares local HEAD against the
# `deploy` branch (pushed by CI with built assets included) and only
# does anything when there's a new commit to deploy.
set -euo pipefail
export PATH="/opt/alt/php83/usr/bin:$PATH"

APP_DIR="$HOME/domains/home.guykats.com/app"
cd "$APP_DIR"

git fetch origin deploy --quiet

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/deploy)

if [ "$LOCAL" = "$REMOTE" ]; then
    exit 0
fi

echo "$(date -Is) deploying $REMOTE"

php artisan down --render="errors::503" --retry=30 || true
trap 'php artisan up || true' EXIT

git reset --hard origin/deploy
composer install --no-dev --optimize-autoloader --no-interaction
php artisan config:clear
php artisan migrate --force
php artisan storage:link || true
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "$(date -Is) deployed $REMOTE"
