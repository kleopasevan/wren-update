"""Dashboard API endpoints."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/workspaces/{workspace_id}/dashboards")
async def list_dashboards(workspace_id: str) -> dict[str, str]:
    """List dashboards for a workspace."""
    return {"message": "Dashboards endpoint - coming soon"}


@router.post("/workspaces/{workspace_id}/dashboards")
async def create_dashboard(workspace_id: str) -> dict[str, str]:
    """Create a new dashboard."""
    return {"message": "Create dashboard endpoint - coming soon"}
