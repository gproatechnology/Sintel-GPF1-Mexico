"""Add EMPLOYEE to UserRole enum

Revision ID: 002
Revises: 001
Create Date: 2026-03-19

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add EMPLOYEE to UserRole enum
    op.execute("ALTER TYPE userrole ADD VALUE 'EMPLOYEE'")


def downgrade() -> None:
    # Note: PostgreSQL doesn't support removing enum values easily
    # This would require recreating the type and all dependent columns
    pass