"""Connection service for managing database connections."""
import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.connection_repository import ConnectionRepository
from app.models.connection import Connection


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
        """Test a database connection."""
        # Get connection with permission check
        connection = await self.get_connection(connection_id, workspace_id)

        # TODO: Integrate with ibis-server to test the connection
        # For now, we'll just mark it as untested
        # In Phase 1.4, we'll implement actual connection testing via ibis-server

        # Decrypt connection info
        connection_info = self.connection_repo.get_decrypted_connection_info(connection)

        # Update test status (placeholder)
        await self.connection_repo.update_test_status(
            connection=connection,
            test_status="success",
            test_message="Connection test not yet implemented",
        )

        return {
            "status": "success",
            "message": "Connection test will be implemented in Phase 1.4",
            "tested_at": connection.last_tested_at.isoformat() if connection.last_tested_at else None,
        }

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
