# 🚀 Plan para Completar Sprint 6 - F1 Comedor

## Estado Actual

| Métrica | Valor |
|---------|-------|
| Coverage | 73% |
| Tests Pass | 67 ✅ |
| Tests Errors | 3 🔴 |
| Tests Skipped | 6 |

---

## Problemas Identificados

### 1. Errores en Tests de Concurrencia (3 errores)

**Causa raíz**: El test usa campos incorrectos para el modelo Employee

| Archivo | Línea | Problema |
|---------|-------|----------|
| `tests/test_concurrency.py` | 60-66 | Usa `name="Test Employee"` pero el modelo usa `first_name` y `last_name` |
| `tests/test_concurrency.py` | 62 | Usa `employee_id` pero el modelo usa `employee_number` |
| `tests/test_concurrency.py` | 46 | DB no se limpia (UNIQUE constraint failed) |

### 2. Código Deprecated (warnings)

| Archivo | Líneas | Problema |
|---------|--------|----------|
| `app/core/security.py` | 36, 48 | `datetime.utcnow()` deprecado |
| `app/services/consumption_service.py` | 72 | `datetime.utcnow()` deprecado |
| `app/schemas/*.py` | todos | `example=` deprecated |
| `app/core/config.py` | 8 | `class Config` deprecated |

---

## Plan de Ejecución

### Fase 1: Corregir Tests de Concurrencia (Alta Prioridad)

```python
# ANTES (incorrecto):
employee = Employee(
    name="Test Employee",
    employee_id="EMP001",
    company_id=company.id,
    category_id=category.id,
    qr_code="QR001"
)

# DESPUÉS (correcto):
employee = Employee(
    first_name="Test",
    last_name="Employee",
    employee_number="EMP001",
    company_id=company.id,
    category_id=category.id,
    qr_code="QR001"
)
```

**Acciones**:
- [ ] Corregir `tests/test_concurrency.py` líneas 60-66
- [ ] Agregar cleanup de DB en fixture `test_data`
- [ ] Eliminar archivo `test_concurrency.db` si existe

### Fase 2: Actualizar Código Deprecated (Media Prioridad)

**datetime.utcnow() → datetime.now(datetime.UTC)**:

```python
# ANTES:
from datetime import datetime, timedelta
expire = datetime.utcnow() + timedelta(minutes=30)

# DESPUÉS:
from datetime import datetime, timedelta, UTC
expire = datetime.now(UTC) + timedelta(minutes=30)
```

**Archivos a actualizar**:
- [ ] `app/core/security.py` (líneas 36, 48)
- [ ] `app/services/consumption_service.py` (línea 72)

**Pydantic ConfigDict**:
```python
# ANTES:
class Settings(BaseSettings):
    class Config:
        env_file = ".env"

# DESPUÉS:
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
```

### Fase 3: Incrementar Coverage (73% → 85%)

| Módulo | Coverage Actual | Coverage Objetivo | Acciones |
|--------|---------------|------------------|----------|
| cache.py | 41% | 80% | Añadir tests para hit/miss/eviction |
| seed.py | 0% | 50% | Tests de generación de datos |
| report_service.py | 58% | 75% | Tests de agregaciones |
| employee_service.py | 61% | 75% | Tests de validación |
| main.py | 56% | 70% | Tests de endpoints health |

**Tests nuevos recomendados**:

```python
# tests/test_cache.py (existente - mejorar)
def test_cache_eviction():
    """Test cache eviction when full"""
    
def test_cache_ttl():
    """Test time-to-live expiration"""

# tests/test_employee_service.py (nuevo o expandir)
def test_employee_qr_not_found():
    """Test QR scan with non-existent code"""
    
def test_employee_exact_daily_limit():
    """Test employee at exactly daily limit"""
```

### Fase 4: Documentación

- [ ] Actualizar `SPRINTS.md` con estado final
- [ ] Actualizar `AUDITORIA.md` con nuevo coverage

---

## Comandos de Verificación

```bash
# 1. Ejecutar tests (sin errores)
cd "C:\Users\X1\OneDrive\Documentos\Python_VS Code\GProA\GProA_F1\f1-comeror_1\GProA Desarrollo\Desarrollo_F1\f1-comedor"
python -m pytest -v

# 2. Coverage target
python -m pytest --cov=app --cov-report=term-missing

# 3. Verificar coverage > 85%
python -m pytest --cov=app --cov-report=html
# Abrir htmlcov/index.html
```

---

## Timeline Estimado

| Fase | Complejidad | Tiempo Estimado |
|------|-------------|-----------------|
| Fase 1: Tests Concurrencia | Baja | 15-30 min |
| Fase 2: Deprecated Code | Baja | 30 min |
| Fase 3: Coverage | Media | 1-2 horas |
| Fase 4: Documentación | Baja | 15 min |

**Total**: ~2-3 horas

---

## Criterios de Éxito Sprint 6

- [ ] 0 errores en tests
- [ ] Coverage >= 85%
- [ ] Sin warnings de deprecated (o mínimos)
- [ ] Documentación actualizada
- [ ] Tests de carga pasando (skipped actualmente)

---

*Plan actualizado el 2026-03-20*