"""repair missing Drive storage columns

Revision ID: 6f1a2b3c4d5e
Revises: 5e9f3a2b7c1d
Create Date: 2026-10-05
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "6f1a2b3c4d5e"
down_revision: Union[str, Sequence[str], None] = "5e9f3a2b7c1d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    tables = (
        "course_materials",
        "assignments",
        "assignment_submissions",
        "messages",
        "contents",
        "student_documents",
    )

    for table in tables:
        columns = {column["name"] for column in inspector.get_columns(table)}
        if "drive_file_id" not in columns:
            op.add_column(
                table,
                sa.Column("drive_file_id", sa.String(length=200), nullable=True),
            )

        indexes = {index["name"] for index in inspector.get_indexes(table)}
        index_name = f"ix_{table}_drive_file_id"
        if "drive_file_id" not in columns and index_name not in indexes:
            op.create_index(index_name, table, ["drive_file_id"], unique=False)
        elif "drive_file_id" in columns and index_name not in indexes:
            op.create_index(index_name, table, ["drive_file_id"], unique=False)


def downgrade() -> None:
    # Keep this repair migration non-destructive.
    pass
