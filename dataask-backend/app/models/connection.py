"""Connection database model."""
import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class Connection(Base):
    """Database connection model."""

    __tablename__ = "connections"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    # Connection type: postgres, mysql, bigquery, snowflake, etc.
    type: Mapped[str] = mapped_column(String(50), nullable=False)

    # Encrypted connection details (host, port, database, user, password, etc.)
    # Stored as encrypted text (JSON string)
    connection_info: Mapped[str] = mapped_column(Text, nullable=False)

    # Additional settings (SSL, timeout, etc.)
    settings: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    # Connection status
    status: Mapped[str] = mapped_column(
        String(20),
        default="active",
        nullable=False
    )  # active, inactive, error

    # Last test timestamp and result
    last_tested_at: Mapped[datetime | None] = mapped_column()
    test_status: Mapped[str | None] = mapped_column(String(20))  # success, failed
    test_message: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"<Connection {self.name} ({self.type})>"
