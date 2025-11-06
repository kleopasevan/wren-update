"""Connection service for managing database connections."""
import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.connection_repository import ConnectionRepository
from app.models.connection import Connection
from app.clients.ibis_client import ibis_client


class ConnectionService:
    """Service for connection operations."""

    def __init__(self, db: AsyncSession):
        """Initialize service with database session."""
        self.db = db
        self.connection_repo = ConnectionRepository(db)

    async def list_connections(self, workspace_id: uuid.UUID) -> list[Connection]:
        """List all connections for a workspace."""
        return await self.connection_repo.get_by_workspace_id(workspace_id)

    async def get_connection(
        self, connection_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> Connection:
        """Get a connection by ID (with workspace permission check)."""
        connection = await self.connection_repo.get_by_id_and_workspace(
            connection_id, workspace_id
        )
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Connection not found",
            )
        return connection

    async def create_connection(
        self,
        workspace_id: uuid.UUID,
        name: str,
        type: str,
        connection_info: dict,
        user_id: uuid.UUID,
        description: Optional[str] = None,
        settings: Optional[dict] = None,
    ) -> Connection:
        """Create a new database connection."""
        # Validate connection type
        valid_types = [
            "postgres",
            "postgresql",
            "mysql",
            "bigquery",
            "snowflake",
            "redshift",
            "clickhouse",
            "mssql",
            "trino",
        ]
        if type.lower() not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid connection type. Must be one of: {', '.join(valid_types)}",
            )

        # Create connection with encrypted credentials
        connection = await self.connection_repo.create(
            workspace_id=workspace_id,
            name=name,
            type=type.lower(),
            connection_info=connection_info,
            created_by=user_id,
            description=description,
            settings=settings,
        )

        return connection

    async def update_connection(
        self,
        connection_id: uuid.UUID,
        workspace_id: uuid.UUID,
        name: Optional[str] = None,
        description: Optional[str] = None,
        type: Optional[str] = None,
        connection_info: Optional[dict] = None,
        settings: Optional[dict] = None,
        status: Optional[str] = None,
    ) -> Connection:
        """Update a connection."""
        # Get connection with permission check
        connection = await self.get_connection(connection_id, workspace_id)

        # Validate connection type if being updated
        if type is not None:
            valid_types = [
                "postgres",
                "postgresql",
                "mysql",
                "bigquery",
                "snowflake",
                "redshift",
                "clickhouse",
                "mssql",
                "trino",
            ]
            if type.lower() not in valid_types:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid connection type. Must be one of: {', '.join(valid_types)}",
                )
            type = type.lower()

        # Update connection
        updated_connection = await self.connection_repo.update(
            connection=connection,
            name=name,
            description=description,
            type=type,
            connection_info=connection_info,
            settings=settings,
            status=status,
        )

        return updated_connection

    async def delete_connection(
        self, connection_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> None:
        """Delete a connection."""
        # Get connection with permission check
        connection = await self.get_connection(connection_id, workspace_id)

        # Delete connection
        await self.connection_repo.delete(connection)

    async def test_connection(
        self, connection_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> dict:
        """Test a database connection via ibis-server."""
        # Get connection with permission check
        connection = await self.get_connection(connection_id, workspace_id)

        # Decrypt connection info
        connection_info = self.connection_repo.get_decrypted_connection_info(connection)

        # Test connection via ibis-server
        result = await ibis_client.test_connection(connection.type, connection_info)

        # Update test status based on result
        test_status = "success" if result["status"] == "success" else "failed"
        test_message = result["message"]

        await self.connection_repo.update_test_status(
            connection=connection,
            test_status=test_status,
            test_message=test_message,
        )

        return {
            "status": result["status"],
            "message": result["message"],
            "tested_at": connection.last_tested_at.isoformat() if connection.last_tested_at else None,
        }

    async def get_tables(
        self, connection_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> list[dict]:
        """Get list of tables from the connection."""
        # Get connection with permission check
        connection = await self.get_connection(connection_id, workspace_id)

        # Decrypt connection info
        connection_info = self.connection_repo.get_decrypted_connection_info(connection)

        # Get tables via ibis-server
        tables = await ibis_client.get_tables(connection.type, connection_info)
        return tables

    async def get_constraints(
        self, connection_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> list[dict]:
        """Get constraints (foreign keys, etc.) from the connection."""
        # Get connection with permission check
        connection = await self.get_connection(connection_id, workspace_id)

        # Decrypt connection info
        connection_info = self.connection_repo.get_decrypted_connection_info(connection)

        # Get constraints via ibis-server
        constraints = await ibis_client.get_constraints(connection.type, connection_info)
        return constraints

    async def preview_table(
        self,
        connection_id: uuid.UUID,
        workspace_id: uuid.UUID,
        table_name: str,
        limit: int = 10,
    ) -> dict:
        """Preview data from a table."""
        # Get connection with permission check
        connection = await self.get_connection(connection_id, workspace_id)

        # Decrypt connection info
        connection_info = self.connection_repo.get_decrypted_connection_info(connection)

        # Preview table via ibis-server
        data = await ibis_client.preview_table(
            connection.type, connection_info, table_name, limit
        )
        return data

    async def execute_query(
        self,
        connection_id: uuid.UUID,
        workspace_id: uuid.UUID,
        sql: str,
        limit: Optional[int] = None,
    ) -> dict:
        """Execute a SQL query on a connection."""
        # Get connection with permission check
        connection = await self.get_connection(connection_id, workspace_id)

        # Decrypt connection info
        connection_info = self.connection_repo.get_decrypted_connection_info(connection)

        # Execute query via ibis-server
        data = await ibis_client.execute_query(
            connection.type, connection_info, sql, limit
        )
        return data

    async def build_and_execute_query(
        self,
        connection_id: uuid.UUID,
        workspace_id: uuid.UUID,
        table: str,
        columns: Optional[list[str]] = None,
        filters: Optional[list[dict]] = None,
        group_by: Optional[list[str]] = None,
        order_by: Optional[list[dict]] = None,
        limit: Optional[int] = None,
    ) -> tuple[str, dict]:
        """Build and execute a query from visual components."""
        # Get connection with permission check
        connection = await self.get_connection(connection_id, workspace_id)

        # Build SQL query
        sql = ibis_client.build_sql_query(
            table=table,
            columns=columns,
            filters=filters,
            group_by=group_by,
            order_by=order_by,
            limit=limit,
        )

        # Decrypt connection info
        connection_info = self.connection_repo.get_decrypted_connection_info(connection)

        # Execute query
        data = await ibis_client.execute_query(
            connection.type, connection_info, sql, None  # limit already in SQL
        )

        return sql, data

    def get_connection_info_for_response(self, connection: Connection) -> dict:
        """Get decrypted connection info (for API responses - sensitive fields masked)."""
        decrypted_info = self.connection_repo.get_decrypted_connection_info(connection)

        # Mask sensitive fields for API response
        masked_info = {}
        for key, value in decrypted_info.items():
            if key in ["password", "secret_key", "private_key", "api_key"]:
                masked_info[key] = "****" if value else None
            else:
                masked_info[key] = value

        return masked_info
