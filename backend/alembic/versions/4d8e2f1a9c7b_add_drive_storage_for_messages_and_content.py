"""add Drive storage ids for messages and teacher content

Revision ID: 4d8e2f1a9c7b
Revises: 2c7e91a4b6d8
Create Date: 2026-10-05
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "4d8e2f1a9c7b"
down_revision: Union[str, Sequence[str], None] = "2c7e91a4b6d8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    for table in ("messages", "contents"):
        columns = {c["name"] for c in inspector.get_columns(table)}
        if "drive_file_id" not in columns:
            op.add_column(table, sa.Column("drive_file_id", sa.String(length=200), nullable=True))
            op.create_index(f"ix_{table}_drive_file_id", table, ["drive_file_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    for table in ("contents", "messages"):
        columns = {c["name"] for c in inspector.get_columns(table)}
        if "drive_file_id" in columns:
            op.drop_index(f"ix_{table}_drive_file_id", table_name=table)
            op.drop_column(table, "drive_file_id")
