# NeoVPN Portal — Architecture

## Overview

NeoVPN Portal is a full-stack Next.js application that serves as a customer-facing website and admin panel for a VPN service powered by Remnawave.

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Browser   │────▶│    Nginx    │────▶│  Next.js App │
└─────────────┘     └─────────────┘     └──────┬───────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────┐
                    │                             │                 │
              ┌─────▼─────┐              ┌────────▼────────┐  ┌─────▼─────┐
              │ PostgreSQL │              │  Remnawave API  │  │  Backups  │
              └───────────┘              └─────────────────┘  └───────────┘
```

## Components

### Public Website
- Landing page with hero, features, pricing sections
- Registration and login flows
- SEO-optimized Russian content

### User Portal
- Session-based authentication (HTTP-only cookies)
- Dashboard with account info and subscription status
- Activation code redemption (NEO-XXX-XXX-XXX format)

### Admin Panel
- Separate authentication system (`/admin`)
- User management, code generation, Remnawave settings
- Audit logs, database backup/export

### Remnawave Integration Layer
- `src/lib/remnawave.ts` — API client with retry logic
- User creation on registration
- Subscription extension and squad assignment on code activation

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Customer accounts |
| `user_sessions` | Active user sessions |
| `admins` | Administrator accounts |
| `admin_sessions` | Admin sessions |
| `remnawave_mappings` | Local ↔ Remnawave user mapping |
| `activation_codes` | Subscription activation codes |
| `settings` | App config (encrypted secrets) |
| `audit_logs` | Security audit trail |
| `rate_limit_entries` | Rate limiting state |

## Security Architecture

- **Passwords:** Argon2id hashing via `@node-rs/argon2`
- **Secrets:** AES-256-GCM encryption for API keys in database
- **Sessions:** Cryptographically random tokens, HTTP-only cookies
- **CSRF:** Double-submit cookie pattern
- **Rate limiting:** Database-backed per-IP limits
- **Account lockout:** 5 failed attempts → 15 min lockout

## Activation Code Flow

1. Admin generates codes with duration (hidden from users)
2. User enters code on dashboard
3. System validates code (status, expiry)
4. Transaction marks code as USED
5. Remnawave API updates subscription + assigns squad
6. User redirected to subscription URL

## Deployment

Docker Compose stack: PostgreSQL → App → Nginx

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup.
