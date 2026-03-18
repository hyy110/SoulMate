"""add_voice_training_fields

Revision ID: 0f4d3ab8be11
Revises: 3ed1373d3eb3
Create Date: 2026-03-18 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0f4d3ab8be11"
down_revision: Union[str, None] = "3ed1373d3eb3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("voice_profiles", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("voice_type", sa.String(length=30), nullable=False, server_default="cloned_zeroshot")
        )
        batch_op.add_column(
            sa.Column("status", sa.String(length=20), nullable=False, server_default="ready")
        )
        batch_op.add_column(
            sa.Column("training_progress", sa.Float(), nullable=False, server_default="1.0")
        )
        batch_op.add_column(sa.Column("estimated_time", sa.Integer(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("voice_profiles", schema=None) as batch_op:
        batch_op.drop_column("estimated_time")
        batch_op.drop_column("training_progress")
        batch_op.drop_column("status")
        batch_op.drop_column("voice_type")
