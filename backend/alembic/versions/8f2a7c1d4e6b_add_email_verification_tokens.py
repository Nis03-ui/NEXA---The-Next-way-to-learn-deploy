"""add email verification token storage

Revision ID: 8f2a7c1d4e6b
Revises: cf63defc2b7e
Create Date: 2026-10-04

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8f2a7c1d4e6b"
down_revision: Union[str, Sequence[str], None] = "cf63defc2b7e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create email verification token storage if it is not already present.

    The Beta application previously used SQLAlchemy metadata creation at startup,
    so the table may already exist in a deployed database. The existence check
    makes this migration safe for both fresh and already-initialized databases.
    """
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "email_verification_tokens" in inspector.get_table_names():
        return

    op.create_table(
        "email_verification_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("verified_at", sa.DateTime(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )

    op.create_index(
        "ix_email_verification_tokens_user_id",
        "email_verification_tokens",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove email verification token storage."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "email_verification_tokens" not in inspector.get_table_names():
        return

    op.drop_index(
        "ix_email_verification_tokens_user_id",
        table_name="email_verification_tokens",
    )
    op.drop_table("email_verification_tokens")
