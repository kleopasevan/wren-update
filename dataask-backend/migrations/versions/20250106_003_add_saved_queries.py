"""add saved queries table

Revision ID: 003
Revises: 002
Create Date: 2025-11-06 00:03:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    op.create_table(
        'saved_queries',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('connection_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('query', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['connection_id'], ['connections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
    )

    # Create indexes for performance
    op.create_index('ix_saved_queries_workspace_id', 'saved_queries', ['workspace_id'])
    op.create_index('ix_saved_queries_connection_id', 'saved_queries', ['connection_id'])
    op.create_index('ix_saved_queries_created_by', 'saved_queries', ['created_by'])


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_index('ix_saved_queries_created_by', table_name='saved_queries')
    op.drop_index('ix_saved_queries_connection_id', table_name='saved_queries')
    op.drop_index('ix_saved_queries_workspace_id', table_name='saved_queries')
    op.drop_table('saved_queries')
