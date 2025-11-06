"""add query history table

Revision ID: 004
Revises: 003
Create Date: 2025-11-06 00:04:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    op.create_table(
        'query_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('connection_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('query_type', sa.String(length=20), nullable=False),
        sa.Column('query_definition', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('sql', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('row_count', sa.Integer(), nullable=True),
        sa.Column('execution_time_ms', sa.Float(), nullable=True),
        sa.Column('executed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['connection_id'], ['connections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
    )

    # Create indexes for performance
    op.create_index('ix_query_history_workspace_id', 'query_history', ['workspace_id'])
    op.create_index('ix_query_history_connection_id', 'query_history', ['connection_id'])
    op.create_index('ix_query_history_user_id', 'query_history', ['user_id'])
    op.create_index('ix_query_history_executed_at', 'query_history', ['executed_at'])


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_index('ix_query_history_executed_at', table_name='query_history')
    op.drop_index('ix_query_history_user_id', table_name='query_history')
    op.drop_index('ix_query_history_connection_id', table_name='query_history')
    op.drop_index('ix_query_history_workspace_id', table_name='query_history')
    op.drop_table('query_history')
