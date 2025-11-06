"""Query history database models."""
import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, Text, Integer, Float
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class QueryHistory(Base):
    """Query history model - tracks all executed queries."""

    __tablename__ = "query_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    connection_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("connections.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    query_type: Mapped[str] = mapped_column(String(20), nullable=False)  # visual, ai, sql
    query_definition: Mapped[dict | None] = mapped_column(JSONB)  # QueryDefinition if visual
    sql: Mapped[str] = mapped_column(Text, nullable=False)  # Actual SQL executed
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # success, error
    error_message: Mapped[str | None] = mapped_column(Text)
    row_count: Mapped[int | None] = mapped_column(Integer)
    execution_time_ms: Mapped[float | None] = mapped_column(Float)  # Execution time in milliseconds
    executed_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    def __repr__(self) -> str:
        """String representation."""
        return f"<QueryHistory {self.query_type} - {self.status}>"
