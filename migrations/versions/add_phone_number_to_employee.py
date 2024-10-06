"""Add phone_number to Employee model

Revision ID: add_phone_number_to_employee
Revises: fb9025ae3d0d
Create Date: 2023-10-06 18:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_phone_number_to_employee'
down_revision = 'fb9025ae3d0d'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('employee', sa.Column('phone_number', sa.String(20), nullable=True))

def downgrade():
    op.drop_column('employee', 'phone_number')
