"""FastAPI main application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import asyncio

from app.core.config import settings
from app.api import api_router

# Rate limiter configuration
limiter = Limiter(key_func=get_remote_address)

# WebSocket connection manager
class ConnectionManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {
            "scanner": [],
            "dashboard": [],
            "admin": []
        }
    
    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)
    
    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections:
            if websocket in self.active_connections[channel]:
                self.active_connections[channel].remove(websocket)
    
    async def broadcast(self, channel: str, message: dict):
        """Broadcast message to all clients in a channel"""
        if channel in self.active_connections:
            disconnected = []
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            # Remove disconnected clients
            for conn in disconnected:
                self.disconnect(conn, channel)
    
    async def broadcast_consumption(self, consumption_data: dict):
        """Broadcast new consumption to all relevant channels"""
        await self.broadcast("dashboard", {
            "type": "new_consumption",
            "data": consumption_data
        })
        await self.broadcast("admin", {
            "type": "new_consumption",
            "data": consumption_data
        })

# Global connection manager
manager = ConnectionManager()

# Create FastAPI application
app = FastAPI(
    title="F1 Comedor API",
    version="1.0.0",
    description="""## F1 Comedor - Restaurant Management System API

Sistema de gestión de comedor empresarial con las siguientes características:

### Funcionalidades
- **Autenticación**: JWT con refresh tokens
- **Gestión de Empleados**: Códigos QR únicos
- **Control de Consumos**: Registro de comidas con límites
- **Reportes**: Dashboard y exportación Excel
- **Tiempo Real**: WebSockets para notificaciones

### Roles
- `ADMIN`: Acceso completo al sistema
- `SUPERVISOR`: Supervisión y reportes
- `CASHIER`: Registro de consumos
- `EMPLOYEE`: Consulta de consumos propios

### Autenticación
Todos los endpoints (excepto `/auth/login`) requieren token JWT en el header:
```
Authorization: Bearer <token>
```
""",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    contact={
        "name": "F1 Comedor Team",
        "email": "soporte@f1comedor.com"
    },
    license_info={
        "name": "Proprietary",
        "url": "https://f1comedor.com"
    },
    tags=[
        {"name": "Auth", "description": "Autenticación y tokens"},
        {"name": "Companies", "description": "Gestión de empresas"},
        {"name": "Employees", "description": "Gestión de empleados"},
        {"name": "Categories", "description": "Categorías de empleados"},
        {"name": "Consumptions", "description": "Registro de consumos"},
        {"name": "Menu", "description": "Menú del día"},
        {"name": "Reports", "description": "Reportes y estadísticas"},
        {"name": "WebSocket", "description": "Conexiones en tiempo real"},
    ]
)

# Add rate limiter to app state
app.state.limiter = limiter
app.state.ws_manager = manager

# Add CORS middleware
ALLOWED_ORIGINS = settings.ALLOWED_ORIGINS.split(",") if settings.ALLOWED_ORIGINS else ["http://localhost:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for local development (Vite is on 5174)
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ws: wss:;"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Include API router
app.include_router(api_router)

# Include metrics router
from app.metrics import router as metrics_router
app.include_router(metrics_router)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Handle rate limit exceeded errors"""
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."}
    )


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# WebSocket endpoint
@app.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    """
    WebSocket endpoint for real-time updates.
    
    Channels:
    - scanner: For scanner operators
    - dashboard: For dashboard viewers
    - admin: For admin panel
    """
    valid_channels = ["scanner", "dashboard", "admin"]
    if channel not in valid_channels:
        await websocket.close(code=4004, reason="Invalid channel")
        return
    
    await manager.connect(websocket, channel)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                # Handle ping/pong for keep-alive
                if message.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
    except Exception:
        manager.disconnect(websocket, channel)
