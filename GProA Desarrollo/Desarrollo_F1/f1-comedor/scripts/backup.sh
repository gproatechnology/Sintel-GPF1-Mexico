#!/bin/bash
# ============================================
# F1 Comedor - Script de Backup Automatizado
# ============================================

set -e

# Configuración
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${RETENTION_DAYS:-7}

# Colores para output
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

# Obtener URL de DB desde variable de entorno o usar默认值
DATABASE_URL="${DATABASE_URL:-postgresql://f1comedor:f1comedor123@localhost:5432/f1comedor}"

# Extraer componentes de la URL
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"

log_info "Iniciando backup de la base de datos..."

# Nombre del archivo de backup
BACKUP_FILE="$BACKUP_DIR/f1comedor_backup_$DATE.sql.gz"

# Ejecutar backup
export PGPASSWORD="$DB_PASS"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_info "Backup creado exitosamente: $BACKUP_FILE (Tamaño: $FILE_SIZE)"
    
    # Guardar referencia del último backup
    echo "$BACKUP_FILE" > "$BACKUP_DIR/latest_backup"
else
    log_error "Error al crear el backup"
    exit 1
fi

# Limpiar backups antiguos
log_info "Limpiando backups antiguos (más de $RETENTION_DAYS días)..."
find "$BACKUP_DIR" -name "f1comedor_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Contar backups restantes
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "f1comedor_backup_*.sql.gz" | wc -l)
log_info "Backups restantes: $BACKUP_COUNT"

log_info "Proceso de backup completado exitosamente"