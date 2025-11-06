"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import auth, health, workspaces, connections, dashboards
from app.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(workspaces.router, prefix="/api/v1", tags=["workspaces"])
app.include_router(connections.router, prefix="/api/v1", tags=["connections"])
app.include_router(dashboards.router, prefix="/api/v1", tags=["dashboards"])


@app.on_event("startup")
async def startup_event() -> None:
    """Startup event handler."""
    # Initialize connections, warm up caches, etc.
    pass


@app.on_event("shutdown")
async def shutdown_event() -> None:
    """Shutdown event handler."""
    # Close connections, cleanup, etc.
    pass
