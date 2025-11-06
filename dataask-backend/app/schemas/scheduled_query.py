"""Scheduled query Pydantic schemas."""
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, EmailStr


class ScheduledQueryBase(BaseModel):
    """Base scheduled query schema."""

    name: str = Field(..., description="Query name", min_length=1, max_length=255)
    description: str | None = Field(None, description="Query description")
    connection_id: str = Field(..., description="Connection ID")
    query_type: Literal["visual", "sql"] = Field(..., description="Query type")
    query_definition: dict | None = Field(None, description="Visual query definition")
    sql: str | None = Field(None, description="Raw SQL query")
    schedule_type: Literal["cron", "interval"] = Field(..., description="Schedule type")
    cron_expression: str | None = Field(None, description="Cron expression (for cron type)")
    interval_minutes: int | None = Field(None, description="Interval in minutes (for interval type)", ge=1)
    recipients: list[str] = Field(..., description="Email recipients", min_length=1)
    subject: str | None = Field(None, description="Email subject", max_length=255)
    format: list[Literal["csv", "pdf"]] = Field(..., description="Export formats", min_length=1)
    enabled: bool = Field(True, description="Whether schedule is enabled")


class ScheduledQueryCreate(ScheduledQueryBase):
    """Schema for creating a scheduled query."""

    pass


class ScheduledQueryUpdate(BaseModel):
    """Schema for updating a scheduled query."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    connection_id: str | None = None
    query_type: Literal["visual", "sql"] | None = None
    query_definition: dict | None = None
    sql: str | None = None
    schedule_type: Literal["cron", "interval"] | None = None
    cron_expression: str | None = None
    interval_minutes: int | None = Field(None, ge=1)
    recipients: list[str] | None = Field(None, min_length=1)
    subject: str | None = Field(None, max_length=255)
    format: list[Literal["csv", "pdf"]] | None = Field(None, min_length=1)
    enabled: bool | None = None


class ScheduledQuery(ScheduledQueryBase):
    """Schema for scheduled query response."""

    id: str
    workspace_id: str
    last_run_at: datetime | None
    last_run_status: str | None
    last_run_error: str | None
    next_run_at: datetime | None
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
