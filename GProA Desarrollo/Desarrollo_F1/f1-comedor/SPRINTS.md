# 🚀 Plan de Sprints - F1 Comedor

## 📊 Estado Actual del Proyecto (2026-03-20)

| Área | Score | Estado |
|------|-------|--------|
| Backend | 9/10 | ✅ Funcional |
| Frontend | 9/10 | ✅ Funcional |
| Seguridad | 9/10 | ✅ Mejorada |
| Testing | 9/10 | ✅ Mejorado (79 tests) |
| DevOps | 9/10 | ✅ Docker + CI/CD |
| Escalabilidad | 8.5/10 | ✅ Redis + WebSockets |

---

## ✅ Completados (Sprints 1-5)

### Sprint 1: Seguridad Crítica
- [x] Bypass de emergencia eliminado
- [x] SECRET_KEY configurada via entorno
- [x] Rate limiting (60 req/min)
- [x] Logging de auditoría
- [x] Headers de seguridad (CSP, X-Frame-Options, etc.)

### Sprint 2: Estabilidad y Rendimiento
- [x] Query N+1 corregida en dashboard
- [x] Paginación implementada
- [x] Cacheo de consultas (Redis)
- [x] Optimización de consultas

### Sprint 3: Testing y Calidad
- [x] Coverage 73%
- [x] Tests de integración API
- [x] Tests E2E con Playwright (12 casos)

### Sprint 4: Funcionalidades Extras
- [x] WebSockets (tiempo real)
- [x] UI Scanner mejorada
- [x] Exportar a Excel/PDF
- [x] PWA para móvil

### Sprint 5: Producción Crítica
- [x] Migraciones Alembic
- [x] Script de backup automatizado
- [x] Script de restauración
- [x] Prometheus + Grafana
- [x] Métricas personalizadas API
- [x] CI/CD GitHub Actions
- [x] Docker multi-container

---

## 🎯 Sprint 6: Refinamiento y Optimización 🔄 EN PROGRESO

### Objetivo
Limpiar deuda técnica, mejorar seguridad y aumentar coverage de tests.

### Tareas Completadas

| # | Tarea | Estado |
|---|-------|--------|
| 1 | Dividir Admin.jsx en componentes | ✅ Completado |
| 2 | Añadir rol EMPLOYEE al enum | ✅ Completado |
| 3 | Corrección de warnings Pydantic (28→3) | ✅ Completado |
| 4 | Tests de concurrencia corregidos | ✅ Completado |
| 5 | Coverage tests (73%→74%) | ✅ Completado |
| 6 | Tests reportes (zona horaria) | ✅ Completado |
| 7 | 79 tests passing, 0 failed | ✅ Completado |

### Tareas Pendientes

| # | Tarea | Prioridad | Estimación | Estado |
|---|-------|-----------|------------|--------|
| 1 | Coverage de tests a 85% | 🟠 Media | 2 días | ⏳ Pendiente |
| 2 | Documentación de API (OpenAPI) | 🟢 Baja | 1 día | ⏳ Pendiente |
| 3 | Tests de carga con k6 | 🟠 Media | 1.5 días | ⏳ Pendiente |
| 4 | Corregir CORS permisivo | 🔴 Alta | 0.5 días | ⏳ Pendiente |
| 5 | SECRET_KEY segura en producción | 🔴 Alta | 0.5 días | ⏳ Pendiente |

---

## 📋 Detalle de Tareas Pendientes

### 1. Coverage de tests a 85% (⏳ Pendiente)

**Actual:** 73-74%
**Objetivo:** 85%

**Archivos con baja cobertura:**
- `app/services/report_service.py` - 58%
- `app/services/employee_service.py` - 61%
- `app/seed.py` - 0%

**Acciones:**
- Añadir más tests unitarios para servicios
- Tests para edge cases
- Mockear dependencias externas

---

### 2. Documentación OpenAPI (⏳ Pendiente)

**Estado actual:** OpenAPI generado automáticamente por FastAPI

**Acciones:**
- Revisar `/docs` y `/redoc`
- Añadir ejemplos en schemas
- Documentar casos de error

---

### 3. Tests de carga con k6 (⏳ Pendiente)

**Objetivo:** Validar rendimiento bajo carga

**Escenarios a probar:**
- 100 usuarios concurrentes
- 500 usuarios concurrentes
- Peak de 1000 requests/min

**Métricas a validar:**
- Latencia p95 < 500ms
- Throughput > 50 req/s
- Error rate < 1%

---

### 4. Corregir CORS permisivo (⏳ Pendiente)

**Problema actual en `main.py`:**
```python
allow_origins=["*"]  # ⚠️ PELIGRO EN PRODUCCIÓN
```

**Solución:**
```python
allow_origins=["http://localhost:5173", "https://tudominio.com"]
```

---

### 5. SECRET_KEY segura en producción (⏳ Pendiente)

**Problema actual en `docker-compose.yml`:**
```yaml
SECRET_KEY: your-secret-key-change-in-production  # ⚠️ PELIGRO
```

**Solución:**
- Usar variables de entorno seguras
- Generar clave de 32+ caracteres
- No hardcodear en docker-compose

---

## 🎯 Criterios de Aceptación Sprint 6

- [x] Admin.jsx dividido en componentes
- [x] UserRole incluye EMPLOYEE
- [ ] Coverage de tests >= 85%
- [ ] Documentación OpenAPI completa
- [ ] Tests de carga pasando
- [ ] CORS restringido a orígenes específicos
- [ ] SECRET_KEY configurada安全的

---

## 📈 Métricas Objetivo

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Coverage tests | 74% | 85% |
| Warnings | 3 | 0 |
| Tests passing | **79** | 85+ |
| Latencia p95 | - | < 500ms |

---

## 📝 Notas

- Este sprint es el último de la fase 1
- Las tareas de seguridad son prioritarias
- Tests de carga pueden postergarse si hay delays
- Sprint 6 ya tiene 7 tareas completadas

---

*Actualizado el 2026-03-20*