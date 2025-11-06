"""Connection Pydantic schemas."""
import uuid
from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel, ConfigDict, Field


# Base connection schemas
class ConnectionBase(BaseModel):
    """Base connection schema."""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    type: str = Field(..., description="Connection type: postgres, mysql, bigquery, snowflake, etc.")
    settings: dict = {}


class ConnectionCreate(ConnectionBase):
    """Schema for creating a connection."""

    workspace_id: uuid.UUID
    connection_info: dict = Field(..., description="Database connection details (will be encrypted)")


class ConnectionUpdate(BaseModel):
    """Schema for updating a connection."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    type: Optional[str] = None
    connection_info: Optional[dict] = None
    settings: Optional[dict] = None
    status: Optional[str] = None


class ConnectionResponse(ConnectionBase):
    """Schema for connection response."""

    id: uuid.UUID
    workspace_id: uuid.UUID
    status: str
    last_tested_at: Optional[datetime] = None
    test_status: Optional[str] = None
    test_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[uuid.UUID] = None

    # Masked connection info (passwords hidden)
    connection_info: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)


class ConnectionTestResponse(BaseModel):
    """Schema for connection test response."""

    status: str  # success, failed
    message: str
    tested_at: Optional[str] = None


# Database-specific connection info schemas (for validation)
class PostgresConnectionInfo(BaseModel):
    """PostgreSQL connection info schema."""

    host: str
    port: int = 5432
    database: str
    user: str
    password: str
    db_schema: Optional[str] = Field(default="public", alias="schema")
    
    model_config = ConfigDict(populate_by_name=True)


class MySQLConnectionInfo(BaseModel):
    """MySQL connection info schema."""

    host: str
    port: int = 3306
    database: str
    user: str
    password: str


class BigQueryConnectionInfo(BaseModel):
    """BigQuery connection info schema."""

    project_id: str
    dataset_id: Optional[str] = None
    credentials_json: str = Field(..., description="Service account JSON credentials")


class SnowflakeConnectionInfo(BaseModel):
    """Snowflake connection info schema."""

    account: str
    user: str
    password: str
    database: Optional[str] = None
    db_schema: Optional[str] = Field(default=None, alias="schema")
    warehouse: Optional[str] = None
    role: Optional[str] = None
    
    model_config = ConfigDict(populate_by_name=True)


class RedshiftConnectionInfo(BaseModel):
    """Redshift connection info schema."""

    host: str
    port: int = 5439
    database: str
    user: str
    password: str
    db_schema: Optional[str] = Field(default="public", alias="schema")
    
    model_config = ConfigDict(populate_by_name=True)


class ClickHouseConnectionInfo(BaseModel):
    """ClickHouse connection info schema."""

    host: str
    port: int = 9000
    database: str
    user: str
    password: str


class MSSQLConnectionInfo(BaseModel):
    """MSSQL connection info schema."""

    host: str
    port: int = 1433
    database: str
    user: str
    password: str
    db_schema: Optional[str] = Field(default="dbo", alias="schema")
    
    model_config = ConfigDict(populate_by_name=True)


class TrinoConnectionInfo(BaseModel):
    """Trino connection info schema."""

    host: str
    port: int = 8080
    catalog: str
    db_schema: Optional[str] = Field(default=None, alias="schema")
    user: Optional[str] = None
    password: Optional[str] = None
    
    model_config = ConfigDict(populate_by_name=True)
