"""add scheduled queries table

Revision ID: 006
Revises: 005
Create Date: 2025-11-06 00:06:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '006'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    op.create_table(
        'scheduled_queries',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('connection_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('query_type', sa.String(length=20), nullable=False),
        sa.Column('query_definition', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('sql', sa.Text(), nullable=True),
        sa.Column('schedule_type', sa.String(length=20), nullable=False),
        sa.Column('cron_expression', sa.String(length=100), nullable=True),
        sa.Column('interval_minutes', sa.Integer(), nullable=True),
        sa.Column('recipients', postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=True),
        sa.Column('format', postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_run_status', sa.String(length=20), nullable=True),
        sa.Column('last_run_error', sa.Text(), nullable=True),
        sa.Column('next_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['connection_id'], ['connections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
    )

    # Create indexes for performance
    op.create_index('ix_scheduled_queries_workspace_id', 'scheduled_queries', ['workspace_id'])
    op.create_index('ix_scheduled_queries_connection_id', 'scheduled_queries', ['connection_id'])
    op.create_index('ix_scheduled_queries_created_by', 'scheduled_queries', ['created_by'])
    op.create_index('ix_scheduled_queries_enabled', 'scheduled_queries', ['enabled'])
    op.create_index('ix_scheduled_queries_next_run_at', 'scheduled_queries', ['next_run_at'])


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_index('ix_scheduled_queries_next_run_at', table_name='scheduled_queries')
    op.drop_index('ix_scheduled_queries_enabled', table_name='scheduled_queries')
    op.drop_index('ix_scheduled_queries_created_by', table_name='scheduled_queries')
    op.drop_index('ix_scheduled_queries_connection_id', table_name='scheduled_queries')
    op.drop_index('ix_scheduled_queries_workspace_id', table_name='scheduled_queries')
    op.drop_table('scheduled_queries')
