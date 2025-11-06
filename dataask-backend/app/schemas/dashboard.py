"""Dashboard Pydantic schemas."""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# Dashboard schemas
class DashboardBase(BaseModel):
    """Base dashboard schema."""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class DashboardCreate(DashboardBase):
    """Schema for creating a dashboard."""

    workspace_id: uuid.UUID
    layout: list = []
    settings: dict = {}
    parameters: list = []


class DashboardUpdate(BaseModel):
    """Schema for updating a dashboard."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    layout: Optional[list] = None
    settings: Optional[dict] = None
    parameters: Optional[list] = None


class DashboardResponse(DashboardBase):
    """Schema for dashboard response."""

    id: uuid.UUID
    workspace_id: uuid.UUID
    layout: list
    settings: dict
    parameters: list
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Widget schemas
class WidgetBase(BaseModel):
    """Base widget schema."""

    type: str = Field(..., description="Widget type: chart, metric, table, text, filter")
    title: Optional[str] = Field(None, max_length=255)
    config: dict = Field(..., description="Widget configuration")
    position: dict = Field(..., description="Widget position {x, y, w, h}")


class WidgetCreate(WidgetBase):
    """Schema for creating a widget."""

    pass


class WidgetUpdate(BaseModel):
    """Schema for updating a widget."""

    type: Optional[str] = None
    title: Optional[str] = Field(None, max_length=255)
    config: Optional[dict] = None
    position: Optional[dict] = None


class WidgetResponse(WidgetBase):
    """Schema for widget response."""

    id: uuid.UUID
    dashboard_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
