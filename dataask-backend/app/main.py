"""Main FastAPI application."""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import auth, health, workspaces, connections, dashboards, saved_queries, query_history, scheduled_queries
from app.config import settings
from app.services.scheduler_service import scheduler_service

logger = logging.getLogger(__name__)

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
app.include_router(saved_queries.router, prefix="/api/v1", tags=["saved-queries"])
app.include_router(query_history.router, prefix="/api/v1", tags=["query-history"])
app.include_router(scheduled_queries.router, prefix="/api/v1", tags=["scheduled-queries"])


@app.on_event("startup")
async def startup_event() -> None:
    """Startup event handler."""
    logger.info("Starting application...")

    # Start background scheduler
    try:
        scheduler_service.start()
        logger.info("Scheduler service started")

        # Load all scheduled queries from database
        await scheduler_service.load_all_scheduled_queries()
        logger.info("Scheduled queries loaded")
    except Exception as e:
        logger.error(f"Error starting scheduler: {e}")


@app.on_event("shutdown")
async def shutdown_event() -> None:
    """Shutdown event handler."""
    logger.info("Shutting down application...")

    # Shutdown scheduler
    try:
        scheduler_service.shutdown()
        logger.info("Scheduler service stopped")
    except Exception as e:
        logger.error(f"Error stopping scheduler: {e}")
