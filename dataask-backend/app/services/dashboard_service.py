"""Dashboard service for managing dashboards and widgets."""
import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.dashboard_repository import DashboardRepository, WidgetRepository
from app.models.dashboard import Dashboard, Widget


class DashboardService:
    """Service for dashboard operations."""

    def __init__(self, db: AsyncSession):
        """Initialize service with database session."""
        self.db = db
        self.dashboard_repo = DashboardRepository(db)
        self.widget_repo = WidgetRepository(db)

    async def list_dashboards(self, workspace_id: uuid.UUID) -> list[Dashboard]:
        """List all dashboards for a workspace."""
        return await self.dashboard_repo.get_by_workspace_id(workspace_id)

    async def get_dashboard(
        self, dashboard_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> Dashboard:
        """Get a dashboard by ID (with workspace permission check)."""
        dashboard = await self.dashboard_repo.get_by_id_and_workspace(
            dashboard_id, workspace_id
        )
        if not dashboard:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dashboard not found",
            )
        return dashboard

    async def create_dashboard(
        self,
        workspace_id: uuid.UUID,
        name: str,
        user_id: uuid.UUID,
        description: Optional[str] = None,
        layout: Optional[list] = None,
        settings: Optional[dict] = None,
    ) -> Dashboard:
        """Create a new dashboard."""
        dashboard = await self.dashboard_repo.create(
            workspace_id=workspace_id,
            name=name,
            created_by=user_id,
            description=description,
            layout=layout,
            settings=settings,
        )
        return dashboard

    async def update_dashboard(
        self,
        dashboard_id: uuid.UUID,
        workspace_id: uuid.UUID,
        name: Optional[str] = None,
        description: Optional[str] = None,
        layout: Optional[list] = None,
        settings: Optional[dict] = None,
    ) -> Dashboard:
        """Update a dashboard."""
        # Get dashboard with permission check
        dashboard = await self.get_dashboard(dashboard_id, workspace_id)

        # Update dashboard
        updated_dashboard = await self.dashboard_repo.update(
            dashboard=dashboard,
            name=name,
            description=description,
            layout=layout,
            settings=settings,
        )

        return updated_dashboard

    async def delete_dashboard(
        self, dashboard_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> None:
        """Delete a dashboard."""
        # Get dashboard with permission check
        dashboard = await self.get_dashboard(dashboard_id, workspace_id)

        # Delete dashboard (widgets will be deleted via CASCADE)
        await self.dashboard_repo.delete(dashboard)

    # Widget operations
    async def list_widgets(self, dashboard_id: uuid.UUID, workspace_id: uuid.UUID) -> list[Widget]:
        """List all widgets for a dashboard."""
        # Verify dashboard exists and user has access
        await self.get_dashboard(dashboard_id, workspace_id)

        return await self.widget_repo.get_by_dashboard_id(dashboard_id)

    async def get_widget(
        self, widget_id: uuid.UUID, dashboard_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> Widget:
        """Get a widget by ID."""
        # Verify dashboard exists and user has access
        await self.get_dashboard(dashboard_id, workspace_id)

        widget = await self.widget_repo.get_by_id(widget_id)
        if not widget or widget.dashboard_id != dashboard_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Widget not found",
            )
        return widget

    async def create_widget(
        self,
        dashboard_id: uuid.UUID,
        workspace_id: uuid.UUID,
        type: str,
        config: dict,
        position: dict,
        title: Optional[str] = None,
    ) -> Widget:
        """Create a new widget."""
        # Verify dashboard exists and user has access
        await self.get_dashboard(dashboard_id, workspace_id)

        # Validate widget type
        valid_types = ["chart", "metric", "table", "text", "filter"]
        if type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid widget type. Must be one of: {', '.join(valid_types)}",
            )

        widget = await self.widget_repo.create(
            dashboard_id=dashboard_id,
            type=type,
            config=config,
            position=position,
            title=title,
        )
        return widget

    async def update_widget(
        self,
        widget_id: uuid.UUID,
        dashboard_id: uuid.UUID,
        workspace_id: uuid.UUID,
        type: Optional[str] = None,
        title: Optional[str] = None,
        config: Optional[dict] = None,
        position: Optional[dict] = None,
    ) -> Widget:
        """Update a widget."""
        # Get widget with permission check
        widget = await self.get_widget(widget_id, dashboard_id, workspace_id)

        # Validate widget type if being updated
        if type is not None:
            valid_types = ["chart", "metric", "table", "text", "filter"]
            if type not in valid_types:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid widget type. Must be one of: {', '.join(valid_types)}",
                )

        updated_widget = await self.widget_repo.update(
            widget=widget,
            type=type,
            title=title,
            config=config,
            position=position,
        )

        return updated_widget

    async def delete_widget(
        self, widget_id: uuid.UUID, dashboard_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> None:
        """Delete a widget."""
        # Get widget with permission check
        widget = await self.get_widget(widget_id, dashboard_id, workspace_id)

        # Delete widget
        await self.widget_repo.delete(widget)
