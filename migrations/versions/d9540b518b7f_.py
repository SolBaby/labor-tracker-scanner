"""empty message

Revision ID: d9540b518b7f
Revises: a7cb9882fbb6, add_phone_number_to_employee
Create Date: 2024-10-07 15:15:17.021607

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd9540b518b7f'
down_revision = ('a7cb9882fbb6', 'add_phone_number_to_employee')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
