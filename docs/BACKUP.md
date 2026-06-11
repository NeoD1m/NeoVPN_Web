# Backup Guide

## Manual Backup

### Via Admin Panel
1. Go to **Резервные копии**
2. Click **Скачать SQL дамп** for immediate download
3. Or **Создать резервную копию на сервере** to save in `/app/backups`

### Via CLI

```bash
# Docker
docker compose exec app npm run backup

# Local
npm run backup
```

Backups are saved to `BACKUP_DIR` (default: `./backups` or `/app/backups` in Docker).

## Scheduled Backups

Add to crontab on the host:

```bash
# Daily at 3:00 AM
0 3 * * * cd /opt/neovpn && docker compose exec -T app npm run backup >> /var/log/neovpn-backup.log 2>&1
```

### Retention Script

```bash
#!/bin/bash
# /opt/neovpn/scripts/cleanup-backups.sh
find /opt/neovpn/backups -name "*.sql" -mtime +30 -delete
```

Add to cron (weekly):
```
0 4 * * 0 /opt/neovpn/scripts/cleanup-backups.sh
```

## Restore from Backup

### Via Admin Panel
1. Go to **Резервные копии**
2. Paste SQL dump content
3. Click **Импортировать**

⚠️ **Warning:** Import may overwrite existing data.

### Via CLI

```bash
docker compose exec -T postgres psql -U neovpn -d neovpn < backup-file.sql
```

## Export Users and Codes (CSV)

- Users: Admin → Пользователи → CSV button
- Codes: Admin → Коды → CSV button

Or direct API:
```
GET /api/admin/users?export=csv
GET /api/admin/codes?export=csv
```

## Off-Site Backup

Copy backups to remote storage:

```bash
# Example: rsync to remote server
rsync -avz /opt/neovpn/backups/ user@backup-server:/backups/neovpn/

# Example: S3 (with aws cli)
aws s3 sync /opt/neovpn/backups/ s3://your-bucket/neovpn-backups/
```

## Disaster Recovery Checklist

1. Provision new server with Docker
2. Clone repository and configure `.env`
3. Start PostgreSQL: `docker compose up -d postgres`
4. Restore database from latest backup
5. Start full stack: `docker compose up -d`
6. Verify Remnawave connection in admin panel
7. Test user login and activation flow
