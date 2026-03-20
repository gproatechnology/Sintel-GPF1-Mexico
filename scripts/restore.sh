#!/bin/bash
# PostgreSQL Restore Script for F1 Comedor
# Usage: ./scripts/restore.sh backup_file.sql.gz

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-f1comedor}"
DB_USER="${DB_USER:-f1comedor}"
DB_PASSWORD="${DB_PASSWORD:-f1comedor123}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if backup file is provided
if [ -z "$1" ]; then
    log_error "Usage: $0 <backup_file.sql.gz>"
    log_info "Available backups:"
    ls -la ./backups/ 2>/dev/null || echo "No backups directory found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

log_warn "This will overwrite the current database: $DB_NAME"
log_warn "Press Ctrl+C to cancel, or Enter to continue..."
read

log_info "Starting restore from: $BACKUP_FILE"

# Set password
export PGPASSWORD="$DB_PASSWORD"

# Drop and recreate database
log_info "Dropping existing database..."
dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || true

log_info "Creating new database..."
createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"

# Restore from backup
log_info "Restoring data..."
gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"

if [ $? -eq 0 ]; then
    log_info "Restore completed successfully!"
else
    log_error "Restore failed!"
    exit 1
fi

log_info "Restore process completed"
