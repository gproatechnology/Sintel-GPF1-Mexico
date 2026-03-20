"""FastAPI main application"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse
from typing import List
import json
import asyncio

from app.core.config import settings
from app.api import api_router


# WebSocket Connection Manager
class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Accept and track a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific client."""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            print(f"Error sending message: {e}")
    
    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                disconnected.append(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)


# Global connection manager
manager = ConnectionManager()

# Rate limiter configuration
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="F1 Comedor - Restaurant Management System API"
)

# Add rate limiter to app state
app.state.limiter = limiter

# Add CORS middleware
ALLOWED_ORIGINS = settings.ALLOWED_ORIGINS.split(",") if settings.ALLOWED_ORIGINS else ["http://localhost:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

# Include API router
app.include_router(api_router)


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


# WebSocket Endpoint for Real-time Updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time notifications.
    
    Events:
    - consumption:new: New consumption registered
    - consumption:update: Consumption updated
    - employee:scan: Employee scanned QR code
    - dashboard:refresh: Dashboard should refresh
    """
    await manager.connect(websocket)
    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle client messages
            message_type = message.get("type")
            
            if message_type == "ping":
                await manager.send_personal_message({"type": "pong"}, websocket)
            elif message_type == "subscribe":
                # Client subscribing to specific events
                print(f"Client subscribed to: {message.get('events', [])}")
            elif message_type == "unsubscribe":
                print(f"Client unsubscribed from: {message.get('events', [])}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)


# Helper function to broadcast consumption events
async def broadcast_consumption(consumption_data: dict):
    """Broadcast a new consumption to all connected clients."""
    await manager.broadcast({
        "type": "consumption:new",
        "data": consumption_data
    })


# Helper function to broadcast scan events
async def broadcast_scan(employee_data: dict):
    """Broadcast an employee scan event to all connected clients."""
    await manager.broadcast({
        "type": "employee:scan",
        "data": employee_data
    })
