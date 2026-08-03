# Checklist: new site on this stack (Laravel + Inertia + React + MySQL)

Use this when standing up another app under `domains/<new-domain>/` on
the same Hostinger account, following the pattern in `DEPLOYMENT.md`.

1. **SSH**: host, port, user (same account? confirm port via hPanel →
   Advanced → SSH Access)
2. **PHP path** on the server (likely `/opt/alt/php83/usr/bin/php` —
   confirm version)
3. **Domain** already created in hPanel, with an empty `public_html/`
   under `domains/<new-domain>/`
4. **MySQL**: create DB + user in hPanel → Databases (note the host,
   usually `localhost`)
5. **GitHub repo** URL + branch to deploy
6. Any **app-specific `.env` values** beyond DB/URL (APP_NAME, mail
   settings, etc.)
7. **Node/npm**: none on the server — build assets in CI or locally,
   same as this app
8. **GitHub Actions secrets** if automating (same names as this repo
   and the other project, kept consistent across repos — each repo's
   secrets are independent even when the names match): `SSH_HOST`,
   `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY`, `DEPLOY_PATH`
   (`/home/<user>/domains/<new-domain>/app`)
9. **Repo visibility**: if the new repo is private, the server needs
   its own GitHub credential for `git fetch` to work non-interactively
   (this app's repo is public, so that step was skipped here)

## Layout (reuse as-is)

```
domains/<new-domain>/
├── DO_NOT_UPLOAD_HERE
├── app/                     <- project lives here
└── public_html -> app/public   (symlink)
```
