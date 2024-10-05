"""Add department to Employee model

Revision ID: fb9025ae3d0d
Revises: 12d6c3115000
Create Date: 2023-05-10 12:34:56.789012

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fb9025ae3d0d'
down_revision = '12d6c3115000'
branch_labels = None
depends_on = None


def upgrade():
    # Add department column as nullable
    op.add_column('employee', sa.Column('department', sa.String(50), nullable=True))
    
    # Update existing records with a default value
    op.execute("UPDATE employee SET department = 'Unassigned' WHERE department IS NULL")
    
    # Alter the column to be non-nullable
    op.alter_column('employee', 'department', nullable=False)


def downgrade():
    op.drop_column('employee', 'department')
