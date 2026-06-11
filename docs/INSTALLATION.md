# Installation Guide

## Requirements

- Node.js 22+
- PostgreSQL 16+
- Docker & Docker Compose (recommended)
- Remnawave panel with API token

## Docker Installation (Recommended)

### 1. Clone and configure

```bash
git clone <repository-url> neovpn-portal
cd neovpn-portal
cp .env.example .env
```

### 2. Configure environment

Edit `.env`:

```bash
# Generate encryption key
openssl rand -hex 32

# Set in .env:
ENCRYPTION_KEY=<generated-key>
POSTGRES_PASSWORD=<strong-password>
APP_URL=https://your-domain.com
REMNAWAVE_API_URL=https://your-panel.example.com/api
REMNAWAVE_API_KEY=<your-bearer-token>
ADMIN_PASSWORD=<strong-admin-password>
```

### 3. Start services

```bash
docker compose up -d postgres
docker compose run --rm migrate
docker compose up -d
```

### 4. Verify

- Website: http://localhost (or your domain)
- Admin panel: http://localhost/admin/login
- Default credentials: `admin` / value from `ADMIN_PASSWORD`

### 5. Configure Remnawave

1. Log into admin panel
2. Go to **Remnawave** settings
3. Enter API URL, API key, squad name (default: `MainSquad`)
4. Click **Проверить подключение**

## Manual Installation

```bash
npm install
cp .env.example .env
# Configure DATABASE_URL and other vars

npx prisma migrate deploy
npm run db:seed
npm run build
npm start
```

## Post-Installation

1. Change default admin password (reset via database or add change-password feature)
2. Configure HTTPS (see DEPLOYMENT.md)
3. Set up scheduled backups (see BACKUP.md)
4. Generate activation codes in admin panel

## Troubleshooting

**Remnawave connection fails:**
- Verify API URL includes `/api` suffix if your panel uses it
- Check bearer token in Remnawave panel → API Tokens
- Ensure panel is accessible from server

**Database migration fails:**
- Check PostgreSQL is running and credentials match
- Run `docker compose logs postgres` for errors

**CSRF errors:**
- Ensure cookies are enabled
- Check that requests include `x-csrf-token` header
