"""update connections table

Revision ID: 002
Revises: 001
Create Date: 2025-01-06 00:02:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    # Add new columns to connections table
    op.add_column('connections', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('connections', sa.Column('connection_info', sa.Text(), nullable=True))
    op.add_column('connections', sa.Column('settings', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'))
    op.add_column('connections', sa.Column('test_status', sa.String(length=20), nullable=True))
    op.add_column('connections', sa.Column('test_message', sa.Text(), nullable=True))

    # Migrate data from config to connection_info (convert JSONB to encrypted text)
    # For now, we'll just convert to JSON string - encryption will be handled by the repository layer
    op.execute("""
        UPDATE connections
        SET connection_info = config::text
        WHERE connection_info IS NULL
    """)

    # Make connection_info not nullable after migration
    op.alter_column('connections', 'connection_info', nullable=False)

    # Drop old config column
    op.drop_column('connections', 'config')

    # Update status column length
    op.alter_column('connections', 'status',
        existing_type=sa.String(length=50),
        type_=sa.String(length=20),
        existing_nullable=False
    )


def downgrade() -> None:
    """Downgrade database schema."""
    # Add back config column
    op.add_column('connections', sa.Column('config', postgresql.JSONB(astext_type=sa.Text()), nullable=True))

    # Migrate data back from connection_info to config
    op.execute("""
        UPDATE connections
        SET config = connection_info::jsonb
        WHERE config IS NULL
    """)

    # Make config not nullable
    op.alter_column('connections', 'config', nullable=False)

    # Drop new columns
    op.drop_column('connections', 'test_message')
    op.drop_column('connections', 'test_status')
    op.drop_column('connections', 'settings')
    op.drop_column('connections', 'connection_info')
    op.drop_column('connections', 'description')

    # Revert status column length
    op.alter_column('connections', 'status',
        existing_type=sa.String(length=20),
        type_=sa.String(length=50),
        existing_nullable=False
    )
