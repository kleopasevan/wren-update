"""Scheduled query database models."""
import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, Text, Boolean
from sqlalchemy.dialects.postgresql import JSONB, UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class ScheduledQuery(Base):
    """Scheduled query model - automated query execution with email reports."""

    __tablename__ = "scheduled_queries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    connection_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("connections.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    # Query definition
    query_type: Mapped[str] = mapped_column(String(20), nullable=False)  # visual, sql
    query_definition: Mapped[dict | None] = mapped_column(JSONB)  # For visual queries
    sql: Mapped[str | None] = mapped_column(Text)  # For raw SQL queries

    # Schedule configuration
    schedule_type: Mapped[str] = mapped_column(String(20), nullable=False)  # cron, interval
    cron_expression: Mapped[str | None] = mapped_column(String(100))  # For cron type
    interval_minutes: Mapped[int | None] = mapped_column()  # For interval type

    # Email configuration
    recipients: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    subject: Mapped[str | None] = mapped_column(String(255))
    format: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)  # ['csv', 'pdf']

    # Status
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_run_at: Mapped[datetime | None] = mapped_column()
    last_run_status: Mapped[str | None] = mapped_column(String(20))  # success, error
    last_run_error: Mapped[str | None] = mapped_column(Text)
    next_run_at: Mapped[datetime | None] = mapped_column()

    # Metadata
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"<ScheduledQuery {self.name}>"
