# Plan de Acción - Despliegue a Producción

## Tareas Pendientes

| # | Tarea | Severidad | Estado |
|---|-------|-----------|--------|
| 1 | Configurar HTTPS (Let's Encrypt) | 🔴 Alta | ✅ Completado |
| 2 | Configurar backups PostgreSQL | 🔴 Alta | ✅ Completado |
| 3 | Configurar monitoreo | 🟠 Media | ✅ Completado |

---

## 1. Configurar HTTPS (Let's Encrypt) ✅ COMPLETADO

### Archivos Creados/Actualizados

| Archivo | Descripción |
|---------|-------------|
| `frontend/nginx-ssl.conf` | Configuración nginx con SSL |
| `docker-compose.production.yml` | Compose para producción con HTTPS |
| `scripts/ssl-setup.sh` | Script para certificados Let's Encrypt |
| `.env.production` | Variables de entorno para producción |
| `frontend/Dockerfile` | Actualizado con ARG VITE_API_URL |

### Objetivo
Habilitar comunicación segura con SSL/TLS para proteger datos en tránsito.

### Opciones de Implementación

#### Opción A: Certbot con nginx (Recomendado)
```bash
# Instalar certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d ejemplo.com -d www.ejemplo.com

# Renovar automáticamente
sudo certbot renew --dry-run
```

#### Opción B: Traefik como reverse proxy
```yaml
# docker-compose.yml con Traefik
services:
  traefik:
    image: traefik:v2.10
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./traefik.yml:/traefik.yml
      - ./certs:/certs
    labels:
      - "traefik.enable=true"
```

### Acciones Requeridas

1. **Obtener dominio** (si no se tiene)
   - Comprar dominio o usar servicio DDNS

2. **Configurar DNS**
   - A record: @ → IP del servidor
   - CNAME: www → @

3. **Instalar certificado**
   - Usar Let's Encrypt (gratis)
   - O comprar certificado comercial

4. **Actualizar docker-compose.yml**
   ```yaml
   # Añadir configuración de HTTPS
   environment:
     - VITE_API_URL=https://tu-dominio.com
   ```

5. **Actualizar ALLOWED_ORIGINS**
   ```bash
   # En .env
   ALLOWED_ORIGINS=https://tu-dominio.com
   ```

### Tiempo Estimado: 2-4 horas

### Pasos para Desplegar con HTTPS

1. **Configurar variables de entorno:**
   ```bash
   cp .env.production .env
   # Editar .env con valores reales
   ```

2. **Obtener certificado SSL:**
   ```bash
   # Opción A: Con certbot instalado
   ./scripts/ssl-setup.sh tu-dominio.com
   
   # Opción B: Con Docker
   docker run -it --rm -v $(pwd)/frontend/ssl:/etc/nginx/ssl:rw \
     -v $(pwd)/frontend/public:/var/www/html:rw \
     certbot/certbot:latest certonly --webroot \
     -w /var/www/html --agree-tos --renew-by-default \
     -d tu-dominio.com -d www.tu-dominio.com
   ```

3. **Desplegar:**
   ```bash
   # Usar compose de producción
   docker-compose -f docker-compose.production.yml up -d
   ```

4. **Renovación automática (configurar cron):**
   ```bash
   # Añadir al crontab
   0 0 * * * docker restart f1comedor_frontend_1
   ```

---

## ✅ 2. Configurar Backups PostgreSQL COMPLETADO

### Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `scripts/backup.sh` | Script de backup para host local |
| `scripts/restore.sh` | Script de restauración |
| `scripts/docker-backup.sh` | Script de backup para Docker |
| `docker-compose.backup.yml` | Compose con backups automáticos |

### Objetivo
Garantizar recuperación de datos en caso de fallo.

### Opciones de Implementación

#### Opción A: pg_dump con cron (Simple)
```bash
# Crear script de backup
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="f1comedor_$DATE.sql"

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Ejecutar backup
PGPASSWORD=f1comedor123 pg_dump -h db -U f1comedor f1comedor > $BACKUP_DIR/$FILENAME

# Comprimir
gzip $BACKUP_DIR/$FILENAME

# Eliminar backups mayores a 30 días
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

```bash
# Añadir al crontab
crontab -e
# Añadir línea:
0 2 * * * /path/to/backup.sh
```

#### Opción B: Docker volume backups
```yaml
# docker-compose.yml
volumes:
  postgres_data:
    driver: local

# Script para backup de volumen
docker run --rm -v f1comedor_postgres_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/pgdata_$(date +%Y%m%d).tar.gz /data
```

#### Opción C: Servicio cloud (AWS S3, Google Cloud Storage)
```python
# script_backup_s3.py
import boto3
import subprocess
from datetime import datetime

s3 = boto3.client('s3')
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

# Dump database
subprocess.run(['pg_dump', '-h', 'db', '-U', 'f1comedor', '-f', f'/tmp/f1comedor_{timestamp}.sql'])

# Upload to S3
s3.upload_file(f'/tmp/f1comedor_{timestamp}.sql', 'mi-bucket', f'backups/f1comedor_{timestamp}.sql')
```

### Acciones Requeridas

1. **Crear script de backup**
   - Ubicación: `/scripts/backup.sh`
   - Permisos: `chmod +x`

2. **Configurar cron**
   - Frecuencia: diaria a las 2:00 AM
   - Retention: 30 días

3. **Verificar restoration**
   - Probar restauración en ambiente de staging
   - Documentar proceso de recuperación

4. **Monitorear**
   - Añadir alertas si backup falla
   - Verificar tamaño de archivos

### Tiempo Estimado: 2-3 horas

---

## ✅ 3. Configurar Monitoreo COMPLETADO

### Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `docker-compose.monitoring.yml` | Compose con Prometheus + Grafana |
| `monitoring/prometheus.yml` | Configuración de Prometheus |
| `monitoring/alerts.yml` | Reglas de alertas |
| `monitoring/alertmanager.yml` | Configuración de Alertmanager |

### Servicios Incluidos
- **Prometheus** (puerto 9090) - Recolección de métricas
- **Grafana** (puerto 3030) - Visualización
- **Node Exporter** (puerto 9100) - Métricas del sistema
- **Alertmanager** (puerto 9093) - Gestión de alertas

### Métricas Monitoreadas
- Uptime del servicio
- Tiempo de respuesta
- Tasa de errores
- CPU y memoria
- Espacio en disco

### Objetivo
Observabilidad del sistema en producción.

### Opciones de Implementación

#### Opción A: Prometheus + Grafana (Auto-hospedado)
```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
```

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'f1-comedor-api'
    static_configs:
      - targets: ['app:8000']
```

#### Opción B: Servicios Cloud (Recomendado para producción)
- **Logs:** Datadog, CloudWatch, Papertrail
- **Métricas:** DataDog, New Relic, CloudWatch
- **Alertas:** PagerDuty, OpsGenie

#### Opción C: ELK Stack (Elasticsearch + Logstash + Kibana)
```yaml
# docker-compose.elk.yml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
```

### Métricas a Monitorear

| Métrica | Umbral | Acción |
|---------|--------|--------|
| CPU Usage | >80% 5min | Escalar servicio |
| Memory Usage | >85% | Revisar memory leaks |
| Response Time | >2s | Optimizar queries |
| Error Rate | >1% | Investigar errores |
| DB Connections | >80% max | Revisar pooling |
| Disk Usage | >80% | Limpiar logs/backup |

### Acciones Requeridas

1. **Elegir solución de monitoreo**
   - Cloud: rápido de implementar
   - Self-hosted: mayor control, más trabajo

2. **Configurar logging estructurado**
   ```python
   # Estructura de log JSON
   {
     "timestamp": "2026-03-20T12:00:00Z",
     "level": "ERROR",
     "message": "Login failed",
     "user_id": 123,
     "ip": "192.168.1.1"
   }
   ```

3. **Configurar health checks**
   - `/health` endpoint ya existe
   - Añadir checks adicionales: DB, cache

4. **Configurar alertas**
   - Email/Slack para errores críticos
   -PagerDuty para incidentes

### Tiempo Estimado: 4-8 horas

---

## Plan de Ejecución Sugerido

### Semana 1

| Día | Tarea |
|-----|-------|
| Lunes | Configurar DNS y obtener dominio |
| Martes | Configurar HTTPS con Let's Encrypt |
| Miércoles | Crear script de backup y configurar cron |
| Jueves | Configurar backups a cloud storage |
| Viernes | Testing de restauración |

### Semana 2

| Día | Tarea |
|-----|-------|
| Lunes | Implementar solución de monitoreo |
| Martes | Configurar logging estructurado |
| Miércoles | Configurar alertas |
| Jueves | Pruebas de carga |
| Viernes | Documentación y handover |

---

## Checklist de Verificación

### Pre-despliegue
- [ ] Dominio configurado y funcionando
- [ ] Certificado SSL instalado y renovación configurada
- [ ] Backups automatizados funcionando
- [ ] Proceso de restauración documentado y probado
- [ ] Monitoreo configurado
- [ ] Alertas configuradas y funcionando

### Post-despliegue
- [ ] HTTPS funcionando (verificar con testssl)
- [ ] Backup realizado exitosamente
- [ ] Métricas visible en dashboard
- [ ] Alertas probadas
- [ ] Health check returning 200

---

## Recursos

- [Let's Encrypt](https://letsencrypt.org/)
- [Certbot](https://certbot.eff.org/)
- [PostgreSQL Backup](https://www.postgresql.org/docs/current/backup.html)
- [Prometheus](https://prometheus.io/)
- [Grafana](https://grafana.com/)

---

*Plan creado: 2026-03-20*
*Proyecto: F1 Comedor - Despliegue a Producción*
