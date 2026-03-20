# 📘 Filosofía de Operación - F1 Comedor

## 1. Propósito del Sistema

**F1 Comedor** es un sistema de gestión de comedor empresarial que automatiza el registro de consumos de alimentos mediante códigos QR, permitiendo a las empresas controlar y optimizar el servicio de alimentación para sus empleados.

---

## 2. Modelo de Negocio

### 2.1 Actores del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE OPERACIÓN                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│   │ EMPRESA  │───►│ CATEGORÍA│───►│ EMPLEADO │               │
│   │ (Company)│    │(Category)│    │(Employee)│               │
│   └──────────┘    └──────────┘    └────┬─────┘               │
│                                        │                       │
│                                        ▼                       │
│                                 ┌──────────────┐              │
│                                 │  CONSUMO    │              │
│                                 │(Consumption)│              │
│                                 └──────────────┘              │
│                                        │                       │
│                                        ▼                       │
│                                 ┌──────────────┐              │
│                                 │   USUARIO   │              │
│                                 │    (User)   │              │
│                                 └──────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Roles de Usuario

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **ADMIN** | Administrador del sistema | Gestión completa: empresas, categorías, empleados, usuarios, reportes |
| **SUPERVISOR** | Supervisor de turno | Ver reportes, gestionar consumos del día |
| **CASHIER** | Cajero/Operador | Escanear QR, registrar consumos, ver empleados |

### 2.3 Flujo Operativo Principal

```
1. La EMPRESA se da de alta en el sistema
2. Se crean CATEGORÍAS con límites (desayuno, comida, cena)
3. Se dan de alta EMPLEADOS con código QR único
4. El empleado llega al comedor y presenta su código QR
5. El CAJERO/OOPERADOR escanea el código
6. El sistema valida:
   - Límite diario de la categoría
   - Límite de crédito disponible
   - Evitar duplicados (mismo empleado en ventana de 5 min)
7. Se registra el CONSUMO y se descuenta del crédito
8. Reportes en tiempo real para la empresa
```

---

## 3. Arquitectura Técnica

### 3.1 Stack Tecnológico

| Capa | Tecnología |
|------|-------------|
| **Backend** | FastAPI (Python 3.11) |
| **Frontend** | React 18 + Vite |
| **Base de Datos** | PostgreSQL 15 |
| **Autenticación** | JWT (Access + Refresh tokens) |
| **Contenedores** | Docker + Docker Compose |

### 3.2 Estructura de Archivos

```
f1-comedor/
├── app/                          # Backend
│   ├── api/                       # Endpoints REST
│   │   ├── auth.py               # Login, refresh token
│   │   ├── companies.py          # CRUD Empresas
│   │   ├── categories.py         # CRUD Categorías
│   │   ├── employees.py          # CRUD Empleados + QR
│   │   ├── consumptions.py       # Registro de consumos
│   │   ├── menu_items.py         # Menú del día
│   │   └── reports.py           # Reportes + Excel export
│   ├── models/                   # Modelos SQLAlchemy
│   ├── schemas/                  # Schemas Pydantic
│   ├── services/                 # Lógica de negocio
│   ├── core/                     # Config, seguridad, QR
│   ├── db/                       # Conexión a BD
│   ├── main.py                   # App FastAPI
│   └── seed.py                   # Datos iniciales
├── frontend/                     # Frontend React
│   ├── src/
│   │   ├── pages/               # Vistas (Dashboard, Scanner, Admin)
│   │   ├── components/          # Componentes reutilizables
│   │   ├── services/            # API calls
│   │   ├── context/             # AuthContext
│   │   └── utils/               # Helpers
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml            # Orquestación
├── Dockerfile                    # Backend
├── requirements.txt             # Dependencias Python
└── pytest.ini                    # Configuración tests
```

---

## 4. Reglas de Negocio

### 4.1 Límites por Categoría

Cada categoría (empleado, visitante, etc.) tiene:
- **Límite diario**: Número máximo de consumos por día
- **Límite de crédito**: Crédito disponible para consumos

### 4.2 Validaciones en el Consumo

```
✓ Empleado existe y está activo
✓ Categoría existe y está activa
✓ No ha alcanzado el límite diario
✓ Tiene crédito disponible
✓ No es un escaneo duplicado (ventana de 5 minutos)
```

### 4.3 Horarios de Comida

| Comida | Horario |
|--------|---------|
| Desayuno | 07:00 - 09:00 |
| Comida | 12:00 - 14:00 |
| Cena | 19:00 - 21:00 |

---

## 5. Funcionalidades Actuales

### 5.1 Módulos Implementados

| Módulo | Funcionalidad | Estado |
|--------|---------------|--------|
| **Auth** | Login JWT, refresh token, logout | ✅ |
| **Empresas** | CRUD completo | ✅ |
| **Categorías** | CRUD con límites configurables | ✅ |
| **Empleados** | CRUD + generación QR | ✅ |
| **Consumos** | Registro con validaciones | ✅ |
| **Menú** | Gestión de platillos del día | ✅ |
| **Reportes** | Por empresa, categoría, empleado | ✅ |
| **Dashboard** | Estadísticas en tiempo real | ✅ |
| **Export** | Excel y PDF | ✅ |
| **PWA** | App móvil instalable | ✅ |

### 5.2 Seguridad Implementada

- ✅ Autenticación JWT (access + refresh)
- ✅ Rate limiting (60 req/min)
- ✅ Logging de auditoría
- ✅ CORS configurado
- ✅ Hash de contraseñas con bcrypt

---

## 6. Ideas para Desarrollo Futuro

### 6.1 Mejoras Inmediatas (Corto Plazo)

| # | Idea | Descripción | Prioridad |
|---|-----|-------------|-----------|
| 1 | **App Móvil Nativa** | App Flutter/React Native para empleados (ver saldo, historial) | Alta |
| 2 | **Notificaciones Push** | Recordatorios de menú, alertas de crédito bajo | Media |
| 3 | **Kiosko Auto** | Pantalla táctil para auto-check-in de empleados | Media |
| 4 | **Menú Semanal** | Planificador de menú con rotación automática | Baja |
| 5 | **Multi-sucursal** | Una empresa con múltiples comedores | Baja |

### 6.2 Mejoras de UX/UI

| # | Idea | Descripción |
|---|-----|-------------|
| 1 | **Tema Oscuro** | Mode dark para el admin |
| 2 | **Dashboard Personalizable** | Widgets arrastrables |
| 3 | **Gráficos Mejorados** | Charts más visuales (Chart.js) |
| 4 | **Progressive Web App** | Already implemented ✅ |

### 6.3 Mejoras Técnicas

| # | Idea | Descripción |
|---|-----|-------------|
| 1 | **WebSockets** | Actualización en tiempo real sin refresh |
| 2 | **Cache Redis** | Cacheo de consultas frecuentes |
| 3 | **API GraphQL** | Endpoints más flexibles |
| 4 | **Microservicios** | Separar API de reportes |
| 5 | **CI/CD** | GitHub Actions para deploy |

### 6.4 Monetización

| # | Idea | Descripción |
|---|-----|-------------|
| 1 | **Planes por Empresa** | Free, Pro, Enterprise |
| 2 | **API Pública** | Cobrar por consumo de API |
| 3 | **Reportes Avanzados** | Analytics premium |

---

## 7. GitHub Pages - ¿Qué publicar?

### 7.1 Limitaciones

**GitHub Pages NO puede ejecutar:**
- ❌ Backend FastAPI (Python)
- ❌ Base de datos PostgreSQL
- ❌ Docker containers
- ❌ API REST

**GitHub Pages SÍ puede servir:**
- ✅ Frontend estático (React build)
- ✅ Documentación (README, Wiki)
- ✅ Landing page pública

### 7.2 Opciones para Publicar

#### Opción A: Solo Frontend Estático
```bash
cd frontend
npm run build
# Subir carpeta 'dist' a GitHub Pages
```
**Limitación:** No tendrá conexión a la API.

#### Opción B: Demo Interactiva (Vercel/Netlify)
- Conectar el repo a **Vercel** o **Netlify**
- Deploy automático del frontend
- Configurar variable `VITE_API_URL` pointing to production API

#### Opción C: Documentación (Wiki)
- Usar GitHub Wiki para documentación
- Crear MANUAL.md, API.md, etc.

### 7.3 Recomendación

Para mostrar el proyecto públicamente:
1. **Frontend demo** → Deploy en Vercel/Netlify (gratis)
2. **Documentación** → GitHub Wiki
3. **Código** → Este repo (GitHub)

---

## 8. Próximos Pasos Recomendados

### Inmediato
- [ ] Actualizar AUDITORIA.md con estado actual
- [ ] Crear Wiki con documentación API
- [ ] Deploy frontend demo en Vercel

### Corto Plazo
- [ ] Implementar app móvil (Flutter)
- [ ] Agregar notificaciones push
- [ ] Mejorar dashboard con gráficos

### Largo Plazo
- [ ] Sistema multi-empresa
- [ ] API GraphQL
- [ ] Planes de monetización

---

*Documento creado: 12 marzo 2026*
*Proyecto: GProA F1 Comedor*
