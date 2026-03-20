#!/bin/bash
# ============================================
# F1 Comedor - Script de Restauración de Backup
# ============================================

set -e

# Configuración
BACKUP_DIR="${BACKUP_DIR:-./backups}"

# Colores para output
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

# Obtener URL de DB
DATABASE_URL="${DATABASE_URL:-postgresql://f1comedor:f1comedor123@localhost:5432/f1comedor}"

# Extraer componentes
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

export PGPASSWORD="$DB_PASS"

# Mostrar ayuda
show_help() {
    echo "Uso: $0 [OPCIONES]"
    echo ""
    echo "Opciones:"
    echo "  -f, --file FILE     Restaurar desde archivo específico"
    echo "  -l, --latest       Restaurar desde el último backup"
    echo "  -L, --list         Listar backups disponibles"
    echo "  -h, --help         Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 --latest"
    echo "  $0 --file ./backups/f1comedor_backup_20260319.sql.gz"
    echo "  $0 --list"
}

# Listar backups
list_backups() {
    log_info "Backups disponibles en $BACKUP_DIR:"
    echo ""
    if [ -d "$BACKUP_DIR" ]; then
        ls -lh "$BACKUP_DIR"/f1comedor_backup_*.sql.gz 2>/dev/null || log_warn "No hay backups disponibles"
    else
        log_error "Directorio de backups no encontrado: $BACKUP_DIR"
        exit 1
    fi
}

# Restaurar desde archivo
restore_from_file() {
    local BACKUP_FILE="$1"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Archivo de backup no encontrado: $BACKUP_FILE"
        exit 1
    fi
    
    log_warn "⚠️  Esta acción reemplazará todos los datos actuales en la base de datos."
    log_warn "⚠️  Base de datos: $DB_NAME en $DB_HOST:$DB_PORT"
    log_warn "⚠️  Archivo: $BACKUP_FILE"
    echo ""
    read -p "¿Continuar? (escriba 'SI' para confirmar): " confirm
    
    if [ "$confirm" != "SI" ]; then
        log_info "Operación cancelada"
        exit 0
    fi
    
    log_info "Iniciando restauración..."
    
    # Verificar si es .gz o .sql
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
    else
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
    fi
    
    log_info "✅ Restauración completada exitosamente"
}

# Restaurar desde el último backup
restore_latest() {
    local LATEST_FILE="$BACKUP_DIR/latest_backup"
    
    if [ ! -f "$LATEST_FILE" ]; then
        log_error "No se encontró referencia al último backup"
        exit 1
    fi
    
    local BACKUP_FILE=$(cat "$LATEST_FILE")
    restore_from_file "$BACKUP_FILE"
}

# Parsear argumentos
case "${1:-}" in
    -f|--file)
        restore_from_file "$2"
        ;;
    -l|--latest)
        restore_latest
        ;;
    -L|--list)
        list_backups
        ;;
    -h|--help)
        show_help
        ;;
    *)
        show_help
        ;;
esac