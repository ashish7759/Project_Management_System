"""Initial schema setup

Revision ID: 0001
Revises: 
Create Date: 2026-06-04 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Department Table
    op.create_table(
        'department',
        sa.Column('department_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('department_name', sa.NVARCHAR(length=100), nullable=False),
        sa.Column('department_head', sa.NVARCHAR(length=100), nullable=True),
        sa.Column('contact_email', sa.NVARCHAR(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('GETDATE()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('department_id'),
        sa.UniqueConstraint('department_name')
    )

    # 2. User Account Table
    op.create_table(
        'user_account',
        sa.Column('user_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('full_name', sa.NVARCHAR(length=100), nullable=False),
        sa.Column('employee_id', sa.NVARCHAR(length=50), nullable=False),
        sa.Column('email', sa.NVARCHAR(length=100), nullable=False),
        sa.Column('mobile', sa.NVARCHAR(length=20), nullable=False),
        sa.Column('username', sa.NVARCHAR(length=50), nullable=False),
        sa.Column('password_hash', sa.NVARCHAR(length=255), nullable=False),
        sa.Column('department_id', sa.Integer(), nullable=True),
        sa.Column('role', sa.NVARCHAR(length=20), nullable=False),
        sa.Column('status', sa.NVARCHAR(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('GETDATE()'), nullable=False),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['department_id'], ['department.department_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('user_id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('employee_id'),
        sa.UniqueConstraint('username')
    )
    op.create_index('ix_user_account_username', 'user_account', ['username'], unique=True)
    op.create_index('ix_user_account_status', 'user_account', ['status'], unique=False)

    # 3. Master Document Table
    op.create_table(
        'master_document',
        sa.Column('document_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('original_file_path', sa.NVARCHAR(length=500), nullable=False),
        sa.Column('file_name', sa.NVARCHAR(length=255), nullable=False),
        sa.Column('file_type', sa.NVARCHAR(length=50), nullable=False),
        sa.Column('upload_date', sa.DateTime(), server_default=sa.text('GETDATE()'), nullable=False),
        sa.Column('uploaded_by', sa.Integer(), nullable=True),
        sa.Column('ocr_status', sa.NVARCHAR(length=20), nullable=False),
        sa.Column('verification_status', sa.NVARCHAR(length=20), nullable=False),
        sa.Column('approved_by', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('raw_ocr_text', sa.NVARCHAR(length='max'), nullable=True),
        sa.Column('ai_extracted_json', sa.NVARCHAR(length='max'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('GETDATE()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['approved_by'], ['user_account.user_id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['uploaded_by'], ['user_account.user_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('document_id')
    )
    op.create_index('ix_master_document_upload_date', 'master_document', ['upload_date'], unique=False)
    op.create_index('ix_master_document_uploaded_by', 'master_document', ['uploaded_by'], unique=False)
    op.create_index('ix_master_document_ocr_status', 'master_document', ['ocr_status'], unique=False)
    op.create_index('ix_master_document_verification_status', 'master_document', ['verification_status'], unique=False)

    # 4. Project Table
    op.create_table(
        'project',
        sa.Column('project_id', sa.NVARCHAR(length=100), nullable=False),
        sa.Column('project_name', sa.NVARCHAR(length=255), nullable=False),
        sa.Column('location', sa.NVARCHAR(length=255), nullable=True),
        sa.Column('district', sa.NVARCHAR(length=100), nullable=True),
        sa.Column('department_id', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('budget_amount', sa.DECIMAL(precision=18, scale=2), nullable=True),
        sa.Column('status', sa.NVARCHAR(length=50), nullable=False),
        sa.Column('actual_progress', sa.DECIMAL(precision=5, scale=2), nullable=False),
        sa.Column('planned_progress', sa.DECIMAL(precision=5, scale=2), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('GETDATE()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['department_id'], ['department.department_id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['document_id'], ['master_document.document_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('project_id')
    )
    op.create_index('ix_project_status', 'project', ['status'], unique=False)
    op.create_index('ix_project_document_id', 'project', ['document_id'], unique=False)

    # 5. Contractor Table
    op.create_table(
        'contractor',
        sa.Column('contractor_id', sa.NVARCHAR(length=100), nullable=False),
        sa.Column('contractor_name', sa.NVARCHAR(length=255), nullable=False),
        sa.Column('work_order_number', sa.NVARCHAR(length=100), nullable=True),
        sa.Column('project_id', sa.NVARCHAR(length=100), nullable=True),
        sa.Column('contact_info', sa.NVARCHAR(length=255), nullable=True),
        sa.Column('registration_number', sa.NVARCHAR(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('GETDATE()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['project.project_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('contractor_id')
    )
    op.create_index('ix_contractor_project_id', 'contractor', ['project_id'], unique=False)

    # 6. Location Table
    op.create_table(
        'location',
        sa.Column('location_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('location_name', sa.NVARCHAR(length=255), nullable=False),
        sa.Column('district', sa.NVARCHAR(length=100), nullable=False),
        sa.Column('state', sa.NVARCHAR(length=100), nullable=False),
        sa.Column('pin_code', sa.NVARCHAR(length=20), nullable=True),
        sa.Column('project_id', sa.NVARCHAR(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('GETDATE()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['project.project_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('location_id')
    )
    op.create_index('ix_location_project_id', 'location', ['project_id'], unique=False)

    # 7. Milestone Table
    op.create_table(
        'milestone',
        sa.Column('milestone_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('project_id', sa.NVARCHAR(length=100), nullable=False),
        sa.Column('target_date', sa.Date(), nullable=False),
        sa.Column('planned_progress', sa.DECIMAL(precision=5, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('GETDATE()'), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['project.project_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('milestone_id')
    )
    op.create_index('ix_milestone_project_id', 'milestone', ['project_id'], unique=False)

    # 8. Progress History Table
    op.create_table(
        'progress_history',
        sa.Column('history_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('project_id', sa.NVARCHAR(length=100), nullable=False),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('actual_progress', sa.DECIMAL(precision=5, scale=2), nullable=False),
        sa.Column('notes', sa.NVARCHAR(length='max'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('GETDATE()'), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['project.project_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['updated_by'], ['user_account.user_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('history_id')
    )
    op.create_index('ix_progress_history_project_id', 'progress_history', ['project_id'], unique=False)
    op.create_index('ix_progress_history_updated_by', 'progress_history', ['updated_by'], unique=False)
    op.create_index('ix_progress_history_updated_at', 'progress_history', ['updated_at'], unique=False)

    # 9. Audit Log Table
    op.create_table(
        'audit_log',
        sa.Column('log_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('username', sa.NVARCHAR(length=100), nullable=True),
        sa.Column('action_type', sa.NVARCHAR(length=100), nullable=False),
        sa.Column('module', sa.NVARCHAR(length=100), nullable=False),
        sa.Column('details', sa.NVARCHAR(length='max'), nullable=True),
        sa.Column('ip_address', sa.NVARCHAR(length=45), nullable=True),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('GETDATE()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user_account.user_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('log_id')
    )
    op.create_index('ix_audit_log_user_id', 'audit_log', ['user_id'], unique=False)
    op.create_index('ix_audit_log_action_type', 'audit_log', ['action_type'], unique=False)
    op.create_index('ix_audit_log_module', 'audit_log', ['module'], unique=False)
    op.create_index('ix_audit_log_timestamp', 'audit_log', ['timestamp'], unique=False)


def downgrade() -> None:
    op.drop_table('audit_log')
    op.drop_table('progress_history')
    op.drop_table('milestone')
    op.drop_table('location')
    op.drop_table('contractor')
    op.drop_table('project')
    op.drop_table('master_document')
    op.drop_table('user_account')
    op.drop_table('department')
