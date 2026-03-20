"""Custom metrics for F1 Comedor API"""
from fastapi import APIRouter, Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import time

router = APIRouter(prefix="/metrics", tags=["Monitoring"])

# Request counters
api_requests_total = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status']
)

# Request duration histogram
api_request_duration_seconds = Histogram(
    'api_request_duration_seconds',
    'API request duration in seconds',
    ['method', 'endpoint']
)

# Database query counter
db_queries_total = Counter(
    'db_queries_total',
    'Total database queries',
    ['table', 'operation']
)

# Active WebSocket connections
ws_connections_active = Counter(
    'ws_connections_active',
    'Active WebSocket connections',
    ['channel']
)


@router.get("")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


@router.get("/health")
async def health_metrics():
    """Health check metrics"""
    return {
        "status": "healthy",
        "timestamp": time.time()
    }