"""Connection API endpoints."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/workspaces/{workspace_id}/connections")
async def list_connections(workspace_id: str) -> dict[str, str]:
    """List connections for a workspace."""
    return {"message": "Connections endpoint - coming soon"}


@router.post("/workspaces/{workspace_id}/connections")
async def create_connection(workspace_id: str) -> dict[str, str]:
    """Create a new connection."""
    return {"message": "Create connection endpoint - coming soon"}
