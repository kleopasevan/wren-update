"""Query builder schemas."""
from typing import Any, Literal
from pydantic import BaseModel, Field


class QueryFilter(BaseModel):
    """Filter for WHERE clause."""

    column: str
    operator: Literal["=", "!=", ">", ">=", "<", "<=", "LIKE", "IN", "IS NULL", "IS NOT NULL"]
    value: Any = None


class QueryOrderBy(BaseModel):
    """Order by clause."""

    column: str
    direction: Literal["ASC", "DESC"] = "ASC"


class QueryDefinition(BaseModel):
    """Visual query builder definition."""

    table: str = Field(..., description="Table name to query")
    columns: list[str] | None = Field(None, description="Columns to select (None = SELECT *)")
    filters: list[QueryFilter] | None = Field(None, description="WHERE clause filters")
    group_by: list[str] | None = Field(None, description="GROUP BY columns")
    order_by: list[QueryOrderBy] | None = Field(None, description="ORDER BY clauses")
    limit: int | None = Field(None, description="LIMIT clause", ge=1, le=10000)


class QueryExecuteRequest(BaseModel):
    """Request to execute a query."""

    query: QueryDefinition | None = Field(None, description="Visual query definition")
    sql: str | None = Field(None, description="Raw SQL query")
    limit: int | None = Field(None, description="Result limit", ge=1, le=10000)


class QueryExecuteResponse(BaseModel):
    """Response from query execution."""

    sql: str = Field(..., description="The executed SQL query")
    data: Any = Field(..., description="Query results")
    row_count: int | None = Field(None, description="Number of rows returned")
