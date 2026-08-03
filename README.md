# Family Hub / המרכז המשפחתי

A mobile-first family management web app, in Hebrew (RTL). Built with Laravel + Inertia.js + React + TypeScript, data persisted in SQLite.

- **לוח שנה (Calendar)** — a Google Calendar-style month board. Swipe left/right (or use the arrow buttons) to move between months, tap a day to add or remove events.
- **קניות (Shopping)** — a shared shopping list. Add items, check them off, or remove them.

## Development

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
composer dev
```

`composer dev` runs the PHP server, queue listener, log tailer, and Vite dev server together.

## Build for production

```bash
npm run build
```
