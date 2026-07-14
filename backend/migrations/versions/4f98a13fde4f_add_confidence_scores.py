"""Add confidence scores

Revision ID: 4f98a13fde4f
Revises: 0001
Create Date: 2026-06-16 15:31:30.918321

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mssql

# revision identifiers, used by Alembic.
revision = '4f98a13fde4f'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('master_document', sa.Column('confidence_scores', sa.NVARCHAR(length='MAX'), nullable=True))
    op.add_column('master_document', sa.Column('overall_confidence', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('master_document', 'overall_confidence')
    op.drop_column('master_document', 'confidence_scores')
