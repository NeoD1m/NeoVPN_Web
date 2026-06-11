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
- Docker deployment with Nginx reverse proxy
- Security: Argon2id, CSRF, rate limiting, audit logs

## Quick Start (Docker)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env - set ENCRYPTION_KEY, POSTGRES_PASSWORD, etc.
# Generate encryption key: openssl rand -hex 32

# 3. Start services
docker compose up -d postgres
docker compose run --rm migrate
docker compose up -d

# 4. Access
# Website: http://localhost
# Admin: http://localhost/admin/login
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
