"""Query history schemas."""

from datetime import datetime
from pydantic import BaseModel, Field


class QueryHistoryBase(BaseModel):
    """Base schema for query history."""

    connection_id: str
    query_type: str = Field(..., description="Type: visual, ai, sql")
    query_definition: dict | None = Field(None, description="QueryDefinition if visual")
    sql: str = Field(..., description="Actual SQL executed")
    status: str = Field(..., description="Status: success, error")
    error_message: str | None = None
    row_count: int | None = None
    execution_time_ms: float | None = None


class QueryHistoryCreate(QueryHistoryBase):
    """Schema for creating query history."""

    pass


class QueryHistory(QueryHistoryBase):
    """Schema for query history response."""

    id: str
    workspace_id: str
    user_id: str
    executed_at: datetime

    class Config:
        from_attributes = True
