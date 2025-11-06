"""add dashboard parameters

Revision ID: 005
Revises: 004
Create Date: 2025-11-06 00:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    # Add parameters column to dashboards table
    op.add_column(
        'dashboards',
        sa.Column('parameters', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]')
    )


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_column('dashboards', 'parameters')
