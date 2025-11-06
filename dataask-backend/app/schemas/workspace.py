"""Workspace Pydantic schemas."""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WorkspaceBase(BaseModel):
    """Base workspace schema."""

    name: str
    description: str | None = None
    settings: dict = {}


class WorkspaceCreate(WorkspaceBase):
    """Schema for creating a workspace."""

    pass


class WorkspaceUpdate(BaseModel):
    """Schema for updating a workspace."""

    name: str | None = None
    description: str | None = None
    settings: dict | None = None


class WorkspaceResponse(WorkspaceBase):
    """Schema for workspace response."""

    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkspaceMemberCreate(BaseModel):
    """Schema for adding a workspace member."""

    user_id: uuid.UUID
    role: str  # admin, editor, viewer


class WorkspaceMemberResponse(BaseModel):
    """Schema for workspace member response."""

    id: uuid.UUID
    workspace_id: uuid.UUID
    user_id: uuid.UUID
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
