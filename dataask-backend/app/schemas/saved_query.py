"""Saved query schemas."""

from datetime import datetime
from pydantic import BaseModel, Field


class SavedQueryBase(BaseModel):
    """Base schema for saved queries."""

    name: str = Field(..., description="Query name", min_length=1, max_length=255)
    description: str | None = Field(None, description="Query description")
    connection_id: str = Field(..., description="Connection ID")
    query: dict = Field(..., description="Query definition (QueryDefinition as dict)")
    tags: list[str] | None = Field(None, description="Tags for categorization")


class SavedQueryCreate(SavedQueryBase):
    """Schema for creating a saved query."""

    pass


class SavedQueryUpdate(BaseModel):
    """Schema for updating a saved query."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    connection_id: str | None = None
    query: dict | None = None
    tags: list[str] | None = None


class SavedQuery(SavedQueryBase):
    """Schema for saved query response."""

    id: str
    workspace_id: str
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
