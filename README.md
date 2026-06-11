# NeoVPN Customer Portal

Production-ready VPN customer portal integrated with [Remnawave](https://remna.st).

## Features

- Public landing page (Russian)
- User registration and authentication
- Personal dashboard with subscription management
- Activation code system (NEO-XXX-XXX-XXX)
- Full Remnawave API integration
- Admin panel with user/code/settings management
- PostgreSQL database with migrations
- Docker deployment (Caddy or optional Nginx)
- Security: Argon2id, CSRF, rate limiting, audit logs

## Quick Start (Docker)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env - set ENCRYPTION_KEY, POSTGRES_PASSWORD, etc.
# Generate encryption key: openssl rand -hex 32

# 3. Set CADDY_NETWORK to the Docker network your Caddy container uses
#    docker inspect caddy --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'

# 4. Start services (no bundled nginx — Caddy handles HTTPS)
docker compose up -d postgres
docker compose --profile migrate build migrate
docker compose --profile migrate run --rm migrate
docker compose up -d

# 5. Add to Caddyfile: reverse_proxy neovpn-web:3000  (see caddy/Caddyfile.example)

# 6. Access
# Website: https://neo-vpn.com
# Admin: https://neo-vpn.com/admin/login
# Default admin: admin / ChangeMeAdmin123!
```

## Development

```bash
npm install
cp .env.example .env
# Set DATABASE_URL to local PostgreSQL

npx prisma migrate dev
npm run db:seed
npm run dev
```

## Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [API Documentation](docs/API.md)
- [Backup Guide](docs/BACKUP.md)
- [Security Checklist](docs/SECURITY.md)
- [Architecture](docs/ARCHITECTURE.md)

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL, Prisma ORM
- **Auth:** Custom sessions with Argon2id
- **Infrastructure:** Docker, Nginx

## License

Proprietary — NeoVPN
