#!/bin/bash
# Docker-based PostgreSQL Backup Script for F1 Comedor
# Usage: ./scripts/docker-backup.sh

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="f1comedor_${DATE}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Docker container name
DB_CONTAINER="f1comedor_db_1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Create backup directory
mkdir -p "$BACKUP_DIR"

log_info "Starting Docker-based backup..."

# Run pg_dump inside the postgres container
docker exec -i "$DB_CONTAINER" pg_dump -U f1comedor f1comedor | gzip > "$BACKUP_DIR/$FILENAME"

if [ $? -eq 0 ]; then
    log_info "Backup completed: $BACKUP_DIR/$FILENAME"
    
    # Clean old backups
    find "$BACKUP_DIR" -name "f1comedor_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    # Verify backup
    if gunzip -t "$BACKUP_DIR/$FILENAME" 2>/dev/null; then
        log_info "Backup verification: OK"
    else
        log_error "Backup verification: FAILED"
        exit 1
    fi
else
    log_error "Backup failed!"
    exit 1
fi
