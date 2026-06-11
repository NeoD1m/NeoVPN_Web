# Production Deployment Guide

## Server Requirements

- Ubuntu 22.04+ or similar Linux
- 2 GB RAM minimum (4 GB recommended)
- Docker 24+ and Docker Compose v2
- Domain name with DNS pointing to server

## Step-by-Step Deployment

### 1. Server preparation

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER
```

### 2. Deploy application

```bash
git clone <repository-url> /opt/neovpn
cd /opt/neovpn
cp .env.example .env
nano .env  # Configure all variables
```

### 3. Start stack

```bash
docker compose up -d postgres
docker compose run --rm migrate
docker compose up -d
```

### 4. HTTPS with Let's Encrypt

Update `nginx/conf.d/default.conf` with your domain, then:

```bash
# Install certbot
sudo apt install certbot

# Obtain certificate
sudo certbot certonly --webroot -w ./certbot/www -d your-domain.com

# Add SSL server block to nginx config
# Reload nginx
docker compose restart nginx
```

Example HTTPS server block:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # ... same location blocks as HTTP config
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

### 5. Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 6. Updates

```bash
cd /opt/neovpn
git pull
docker compose build app
docker compose run --rm migrate
docker compose up -d
```

## Environment Variables (Production)

| Variable | Required | Description |
|----------|----------|-------------|
| `ENCRYPTION_KEY` | Yes | 32+ char key for secret encryption |
| `POSTGRES_PASSWORD` | Yes | Database password |
| `APP_URL` | Yes | Public URL (https://...) |
| `REMNAWAVE_API_URL` | Yes* | Remnawave API base URL |
| `REMNAWAVE_API_KEY` | Yes* | Can be set via admin panel |
| `ADMIN_PASSWORD` | Yes | Initial admin password |

*Can be configured via admin panel after deployment.

## Monitoring

- Check logs: `docker compose logs -f app`
- Health: `curl -I http://localhost`
- Database: `docker compose exec postgres pg_isready`

## Scaling

For high traffic, consider:
- PostgreSQL connection pooling (PgBouncer)
- Redis for rate limiting
- Multiple app instances behind load balancer
