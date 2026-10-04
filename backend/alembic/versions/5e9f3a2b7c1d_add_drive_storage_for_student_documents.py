"""add Drive storage id for student documents

Revision ID: 5e9f3a2b7c1d
Revises: 4d8e2f1a9c7b
Create Date: 2026-10-05
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "5e9f3a2b7c1d"
down_revision: Union[str, Sequence[str], None] = "4d8e2f1a9c7b"
branch_labels = None
depends_on = None

def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {c["name"] for c in inspector.get_columns("student_documents")}
    if "drive_file_id" not in columns:
        op.add_column("student_documents", sa.Column("drive_file_id", sa.String(length=200), nullable=True))
        op.create_index("ix_student_documents_drive_file_id", "student_documents", ["drive_file_id"], unique=False)

def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {c["name"] for c in inspector.get_columns("student_documents")}
    if "drive_file_id" in columns:
        op.drop_index("ix_student_documents_drive_file_id", table_name="student_documents")
        op.drop_column("student_documents", "drive_file_id")
