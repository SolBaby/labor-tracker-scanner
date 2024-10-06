from alembic import op
import sqlalchemy as sa

revision = 'add_total_bathroom_break_duration'
down_revision = 'add_phone_number_to_employee'  # Replace with the actual previous revision ID
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('time_log', sa.Column('total_bathroom_break_duration', sa.Interval(), nullable=True))

def downgrade():
    op.drop_column('time_log', 'total_bathroom_break_duration')
