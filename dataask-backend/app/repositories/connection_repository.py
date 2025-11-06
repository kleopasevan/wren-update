"""Connection repository for database operations."""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.encryption import encrypt_credentials, decrypt_credentials
from app.models.connection import Connection


class ConnectionRepository:
    """Repository for connection database operations."""

    def __init__(self, db: AsyncSession):
        """Initialize repository with database session."""
        self.db = db

    async def get_by_id(self, connection_id: uuid.UUID) -> Optional[Connection]:
        """Get connection by ID."""
        result = await self.db.execute(
            select(Connection).where(Connection.id == connection_id)
        )
        return result.scalar_one_or_none()

    async def get_by_workspace_id(self, workspace_id: uuid.UUID) -> list[Connection]:
        """Get all connections for a workspace."""
        result = await self.db.execute(
            select(Connection)
            .where(Connection.workspace_id == workspace_id)
            .order_by(Connection.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id_and_workspace(
        self, connection_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> Optional[Connection]:
        """Get connection by ID and workspace ID (for permission checks)."""
        result = await self.db.execute(
            select(Connection).where(
                Connection.id == connection_id,
                Connection.workspace_id == workspace_id
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        workspace_id: uuid.UUID,
        name: str,
        type: str,
        connection_info: dict,
        created_by: uuid.UUID,
        description: Optional[str] = None,
        settings: Optional[dict] = None,
    ) -> Connection:
        """Create a new connection with encrypted credentials."""
        # Encrypt connection info before storing
        encrypted_info = encrypt_credentials(connection_info)

        connection = Connection(
            workspace_id=workspace_id,
            name=name,
            description=description,
            type=type,
            connection_info=encrypted_info,
            settings=settings or {},
            status="active",
            created_by=created_by,
        )
        self.db.add(connection)
        await self.db.commit()
        await self.db.refresh(connection)
        return connection

    async def update(
        self,
        connection: Connection,
        name: Optional[str] = None,
        description: Optional[str] = None,
        type: Optional[str] = None,
        connection_info: Optional[dict] = None,
        settings: Optional[dict] = None,
        status: Optional[str] = None,
    ) -> Connection:
        """Update connection."""
        if name is not None:
            connection.name = name
        if description is not None:
            connection.description = description
        if type is not None:
            connection.type = type
        if connection_info is not None:
            # Re-encrypt if connection info is being updated
            connection.connection_info = encrypt_credentials(connection_info)
        if settings is not None:
            connection.settings = settings
        if status is not None:
            connection.status = status

        await self.db.commit()
        await self.db.refresh(connection)
        return connection

    async def update_test_status(
        self,
        connection: Connection,
        test_status: str,
        test_message: Optional[str] = None,
    ) -> Connection:
        """Update connection test status."""
        connection.last_tested_at = datetime.utcnow()
        connection.test_status = test_status
        connection.test_message = test_message

        await self.db.commit()
        await self.db.refresh(connection)
        return connection

    async def delete(self, connection: Connection) -> None:
        """Delete connection."""
        await self.db.delete(connection)
        await self.db.commit()

    def get_decrypted_connection_info(self, connection: Connection) -> dict:
        """Decrypt and return connection info."""
        return decrypt_credentials(connection.connection_info)
