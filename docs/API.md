# API Documentation

Base URL: `https://your-domain.com/api`

All mutating requests require CSRF token in header `x-csrf-token` (obtain via `GET /api/csrf`).

## Authentication

### GET /api/csrf
Returns CSRF token for subsequent requests.

**Response:**
```json
{ "csrfToken": "..." }
```

### POST /api/auth/register
Register a new user.

**Body:**
```json
{
  "username": "string (required, 3-32 chars)",
  "password": "string (required, min 8 chars)",
  "email": "string (optional)",
  "telegramUsername": "string (optional)"
}
```

**Response (201):**
```json
{
  "message": "Регистрация успешно завершена",
  "user": { "id", "username", "email", "telegramUsername" },
  "remnawaveCreated": true,
  "subscriptionUrl": "..."
}
```

### POST /api/auth/login
**Body:** `{ "username", "password" }`

### POST /api/auth/logout
Destroys user session.

## Dashboard

### GET /api/dashboard
Returns user account and subscription info. Requires session.

### POST /api/activation
Activate subscription code.

**Body:**
```json
{ "code": "NEO-ABC-123-XYZ" }
```

**Response:**
```json
{
  "message": "...",
  "subscriptionUrl": "...",
  "expireAt": "2025-07-11T..."
}
```

**Errors:** 400 with Russian error message for invalid/used/revoked/expired codes.

## Admin API

All admin endpoints require admin session cookie (`neovpn_admin_session`).

### POST /api/admin/auth/login
### POST /api/admin/auth/logout

### GET /api/admin/dashboard
Dashboard statistics and recent registrations.

### GET /api/admin/users
Query params: `search`, `page`, `limit`, `export=csv`

### PATCH /api/admin/users
Update user: `{ "userId", "email", "telegramUsername", "isDisabled" }`

### DELETE /api/admin/users?userId=
Delete user.

### POST /api/admin/users
Actions: `{ "action": "reset-password" | "sync-remnawave", "userId" }`

### GET /api/admin/codes
Query params: `status`, `duration`, `export=csv`

### POST /api/admin/codes
Generate codes: `{ "count": 1-100, "durationDays": 1-3650, "expiresAt": "optional ISO" }`

### PATCH /api/admin/codes
Revoke: `{ "codeId", "action": "revoke" }`

### GET /api/admin/settings
### PUT /api/admin/settings
`{ "apiUrl", "apiKey" (optional), "squadName" }`

### POST /api/admin/settings
`{ "action": "test-connection" }`

### GET /api/admin/audit
### GET /api/admin/backup?action=export
### POST /api/admin/backup
`{ "action": "create-backup" | "import", "sql": "..." }`

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Register | 5/min per IP |
| Login | 10/min per IP |
| Activation | 5/min per IP |
| Admin login | 5/min per IP |

## Remnawave API Configuration

Set `REMNAWAVE_API_URL` to your panel's API base URL (e.g. `https://panel.example.com/api`).

Endpoints used:
- `POST /users` — Create user
- `PATCH /users` — Update subscription
- `GET /users/{uuid}` — Get user status
- `GET /internal-squads` — Resolve squad UUID
- `POST /users/{uuid}/actions/disable|enable`
