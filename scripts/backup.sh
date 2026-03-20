#!/bin/bash
# PostgreSQL Backup Script for F1 Comedor
# Usage: ./scripts/backup.sh

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="f1comedor_${DATE}.sql"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Database configuration (from environment or defaults)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-f1comedor}"
DB_USER="${DB_USER:-f1comedor}"
DB_PASSWORD="${DB_PASSWORD:-f1comedor123}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log_info "Starting backup of database: $DB_NAME"

# Perform backup
export PGPASSWORD="$DB_PASSWORD"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -F c -b -v -f "$BACKUP_DIR/$FILENAME" "$DB_NAME"

# Check if backup was successful
if [ $? -eq 0 ]; then
    # Compress the backup
    gzip "$BACKUP_DIR/$FILENAME"
    FILENAME="${FILENAME}.gz"
    
    log_info "Backup completed successfully: $BACKUP_DIR/$FILENAME"
    
    # Get file size
    SIZE=$(du -h "$BACKUP_DIR/$FILENAME" | cut -f1)
    log_info "Backup size: $SIZE"
    
    # Delete old backups
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "f1comedor_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    # Count remaining backups
    BACKUP_COUNT=$(find "$BACKUP_DIR" -name "f1comedor_*.sql.gz" | wc -l)
    log_info "Total backups remaining: $BACKUP_COUNT"
    
    # Verify latest backup
    if [ -f "$BACKUP_DIR/$FILENAME" ]; then
        log_info "Backup verification: OK"
    else
        log_error "Backup verification: FAILED"
        exit 1
    fi
    
else
    log_error "Backup failed!"
    exit 1
fi

log_info "Backup process completed"
