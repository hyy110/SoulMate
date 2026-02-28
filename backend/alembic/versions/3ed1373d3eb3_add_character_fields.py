"""add_character_fields

Revision ID: 3ed1373d3eb3
Revises: 2611845e3d8f
Create Date: 2026-02-28 19:01:10.939377

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from app.models.types import JSONType


# revision identifiers, used by Alembic.
revision: str = '3ed1373d3eb3'
down_revision: Union[str, None] = '2611845e3d8f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('characters', schema=None) as batch_op:
        batch_op.add_column(sa.Column('cover_image_url', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('gender', sa.String(length=20), nullable=False, server_default='female'))
        batch_op.add_column(sa.Column('relationship_type', sa.String(length=20), nullable=False, server_default='girlfriend'))
        batch_op.add_column(sa.Column('personality', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('backstory', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('tags', JSONType(), nullable=True))
        batch_op.add_column(sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'))
        batch_op.add_column(sa.Column('like_count', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('chat_count', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('share_count', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    with op.batch_alter_table('characters', schema=None) as batch_op:
        batch_op.drop_column('share_count')
        batch_op.drop_column('chat_count')
        batch_op.drop_column('like_count')
        batch_op.drop_column('status')
        batch_op.drop_column('tags')
        batch_op.drop_column('backstory')
        batch_op.drop_column('personality')
        batch_op.drop_column('relationship_type')
        batch_op.drop_column('gender')
        batch_op.drop_column('cover_image_url')
