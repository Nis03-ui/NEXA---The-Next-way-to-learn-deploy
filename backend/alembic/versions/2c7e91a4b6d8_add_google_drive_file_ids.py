"""add Google Drive file ids

Revision ID: 2c7e91a4b6d8
Revises: 8f2a7c1d4e6b
Create Date: 2026-10-04
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "2c7e91a4b6d8"
down_revision: Union[str, Sequence[str], None] = "8f2a7c1d4e6b"
branch_labels = None
depends_on = None

def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    for table in ("course_materials", "assignments", "assignment_submissions"):
        columns = {c["name"] for c in inspector.get_columns(table)}
        if "drive_file_id" not in columns:
            op.add_column(table, sa.Column("drive_file_id", sa.String(length=200), nullable=True))
            op.create_index(f"ix_{table}_drive_file_id", table, ["drive_file_id"], unique=False)

def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    for table in ("assignment_submissions", "assignments", "course_materials"):
        columns = {c["name"] for c in inspector.get_columns(table)}
        if "drive_file_id" in columns:
            op.drop_index(f"ix_{table}_drive_file_id", table_name=table)
            op.drop_column(table, "drive_file_id")
