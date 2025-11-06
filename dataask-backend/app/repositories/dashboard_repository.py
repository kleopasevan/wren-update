"""Dashboard repository for database operations."""
import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dashboard import Dashboard, Widget


class DashboardRepository:
    """Repository for dashboard database operations."""

    def __init__(self, db: AsyncSession):
        """Initialize repository with database session."""
        self.db = db

    async def get_by_id(self, dashboard_id: uuid.UUID) -> Optional[Dashboard]:
        """Get dashboard by ID."""
        result = await self.db.execute(
            select(Dashboard).where(Dashboard.id == dashboard_id)
        )
        return result.scalar_one_or_none()

    async def get_by_workspace_id(self, workspace_id: uuid.UUID) -> list[Dashboard]:
        """Get all dashboards for a workspace."""
        result = await self.db.execute(
            select(Dashboard)
            .where(Dashboard.workspace_id == workspace_id)
            .order_by(Dashboard.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id_and_workspace(
        self, dashboard_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> Optional[Dashboard]:
        """Get dashboard by ID and workspace ID (for permission checks)."""
        result = await self.db.execute(
            select(Dashboard).where(
                Dashboard.id == dashboard_id,
                Dashboard.workspace_id == workspace_id
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        workspace_id: uuid.UUID,
        name: str,
        created_by: uuid.UUID,
        description: Optional[str] = None,
        layout: Optional[list] = None,
        settings: Optional[dict] = None,
    ) -> Dashboard:
        """Create a new dashboard."""
        dashboard = Dashboard(
            workspace_id=workspace_id,
            name=name,
            description=description,
            layout=layout or [],
            settings=settings or {},
            created_by=created_by,
        )
        self.db.add(dashboard)
        await self.db.commit()
        await self.db.refresh(dashboard)
        return dashboard

    async def update(
        self,
        dashboard: Dashboard,
        name: Optional[str] = None,
        description: Optional[str] = None,
        layout: Optional[list] = None,
        settings: Optional[dict] = None,
    ) -> Dashboard:
        """Update dashboard."""
        if name is not None:
            dashboard.name = name
        if description is not None:
            dashboard.description = description
        if layout is not None:
            dashboard.layout = layout
        if settings is not None:
            dashboard.settings = settings

        await self.db.commit()
        await self.db.refresh(dashboard)
        return dashboard

    async def delete(self, dashboard: Dashboard) -> None:
        """Delete dashboard."""
        await self.db.delete(dashboard)
        await self.db.commit()


class WidgetRepository:
    """Repository for widget database operations."""

    def __init__(self, db: AsyncSession):
        """Initialize repository with database session."""
        self.db = db

    async def get_by_id(self, widget_id: uuid.UUID) -> Optional[Widget]:
        """Get widget by ID."""
        result = await self.db.execute(
            select(Widget).where(Widget.id == widget_id)
        )
        return result.scalar_one_or_none()

    async def get_by_dashboard_id(self, dashboard_id: uuid.UUID) -> list[Widget]:
        """Get all widgets for a dashboard."""
        result = await self.db.execute(
            select(Widget)
            .where(Widget.dashboard_id == dashboard_id)
            .order_by(Widget.created_at.asc())
        )
        return list(result.scalars().all())

    async def create(
        self,
        dashboard_id: uuid.UUID,
        type: str,
        config: dict,
        position: dict,
        title: Optional[str] = None,
    ) -> Widget:
        """Create a new widget."""
        widget = Widget(
            dashboard_id=dashboard_id,
            type=type,
            title=title,
            config=config,
            position=position,
        )
        self.db.add(widget)
        await self.db.commit()
        await self.db.refresh(widget)
        return widget

    async def update(
        self,
        widget: Widget,
        type: Optional[str] = None,
        title: Optional[str] = None,
        config: Optional[dict] = None,
        position: Optional[dict] = None,
    ) -> Widget:
        """Update widget."""
        if type is not None:
            widget.type = type
        if title is not None:
            widget.title = title
        if config is not None:
            widget.config = config
        if position is not None:
            widget.position = position

        await self.db.commit()
        await self.db.refresh(widget)
        return widget

    async def delete(self, widget: Widget) -> None:
        """Delete widget."""
        await self.db.delete(widget)
        await self.db.commit()
