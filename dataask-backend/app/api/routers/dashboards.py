"""Dashboard API endpoints."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.dashboard import Dashboard, Widget
from app.schemas.dashboard import (
    DashboardCreate,
    DashboardResponse,
    DashboardUpdate,
    WidgetCreate,
    WidgetResponse,
    WidgetUpdate,
)
from app.services.dashboard_service import DashboardService

router = APIRouter()


async def get_workspace_and_check_permission(
    workspace_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> Workspace:
    """Get workspace and check if user has permission to access it."""
    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id)
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    # Check if user owns workspace (will add member check later)
    if workspace.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this workspace",
        )

    return workspace


# Dashboard endpoints
@router.get("/workspaces/{workspace_id}/dashboards", response_model=list[DashboardResponse])
async def list_dashboards(
    workspace_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[Dashboard]:
    """List all dashboards for a workspace."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Get dashboards
    dashboard_service = DashboardService(db)
    dashboards = await dashboard_service.list_dashboards(workspace_id)

    return dashboards


@router.post("/workspaces/{workspace_id}/dashboards", response_model=DashboardResponse, status_code=status.HTTP_201_CREATED)
async def create_dashboard(
    workspace_id: uuid.UUID,
    dashboard_data: DashboardCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Dashboard:
    """Create a new dashboard."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Validate workspace_id matches route parameter
    if dashboard_data.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workspace ID in request body does not match route parameter",
        )

    # Create dashboard
    dashboard_service = DashboardService(db)
    dashboard = await dashboard_service.create_dashboard(
        workspace_id=workspace_id,
        name=dashboard_data.name,
        user_id=current_user.id,
        description=dashboard_data.description,
        layout=dashboard_data.layout,
        settings=dashboard_data.settings,
    )

    return dashboard


@router.get("/workspaces/{workspace_id}/dashboards/{dashboard_id}", response_model=DashboardResponse)
async def get_dashboard(
    workspace_id: uuid.UUID,
    dashboard_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Dashboard:
    """Get a dashboard by ID."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Get dashboard
    dashboard_service = DashboardService(db)
    dashboard = await dashboard_service.get_dashboard(dashboard_id, workspace_id)

    return dashboard


@router.patch("/workspaces/{workspace_id}/dashboards/{dashboard_id}", response_model=DashboardResponse)
async def update_dashboard(
    workspace_id: uuid.UUID,
    dashboard_id: uuid.UUID,
    dashboard_data: DashboardUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Dashboard:
    """Update a dashboard."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Update dashboard
    dashboard_service = DashboardService(db)
    dashboard = await dashboard_service.update_dashboard(
        dashboard_id=dashboard_id,
        workspace_id=workspace_id,
        name=dashboard_data.name,
        description=dashboard_data.description,
        layout=dashboard_data.layout,
        settings=dashboard_data.settings,
    )

    return dashboard


@router.delete("/workspaces/{workspace_id}/dashboards/{dashboard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dashboard(
    workspace_id: uuid.UUID,
    dashboard_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Delete a dashboard."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Delete dashboard
    dashboard_service = DashboardService(db)
    await dashboard_service.delete_dashboard(dashboard_id, workspace_id)


# Widget endpoints
@router.get("/workspaces/{workspace_id}/dashboards/{dashboard_id}/widgets", response_model=list[WidgetResponse])
async def list_widgets(
    workspace_id: uuid.UUID,
    dashboard_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[Widget]:
    """List all widgets for a dashboard."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Get widgets
    dashboard_service = DashboardService(db)
    widgets = await dashboard_service.list_widgets(dashboard_id, workspace_id)

    return widgets


@router.post("/workspaces/{workspace_id}/dashboards/{dashboard_id}/widgets", response_model=WidgetResponse, status_code=status.HTTP_201_CREATED)
async def create_widget(
    workspace_id: uuid.UUID,
    dashboard_id: uuid.UUID,
    widget_data: WidgetCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Widget:
    """Create a new widget."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Create widget
    dashboard_service = DashboardService(db)
    widget = await dashboard_service.create_widget(
        dashboard_id=dashboard_id,
        workspace_id=workspace_id,
        type=widget_data.type,
        config=widget_data.config,
        position=widget_data.position,
        title=widget_data.title,
    )

    return widget


@router.patch("/workspaces/{workspace_id}/dashboards/{dashboard_id}/widgets/{widget_id}", response_model=WidgetResponse)
async def update_widget(
    workspace_id: uuid.UUID,
    dashboard_id: uuid.UUID,
    widget_id: uuid.UUID,
    widget_data: WidgetUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Widget:
    """Update a widget."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Update widget
    dashboard_service = DashboardService(db)
    widget = await dashboard_service.update_widget(
        widget_id=widget_id,
        dashboard_id=dashboard_id,
        workspace_id=workspace_id,
        type=widget_data.type,
        title=widget_data.title,
        config=widget_data.config,
        position=widget_data.position,
    )

    return widget


@router.delete("/workspaces/{workspace_id}/dashboards/{dashboard_id}/widgets/{widget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_widget(
    workspace_id: uuid.UUID,
    dashboard_id: uuid.UUID,
    widget_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Delete a widget."""
    # Check workspace permission
    await get_workspace_and_check_permission(workspace_id, current_user, db)

    # Delete widget
    dashboard_service = DashboardService(db)
    await dashboard_service.delete_widget(widget_id, dashboard_id, workspace_id)
