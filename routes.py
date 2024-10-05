from flask import jsonify, request, render_template
from app import db
from models import Employee, Task, TimeLog
from sqlalchemy import func
from datetime import timedelta, datetime

def init_routes(app):
    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/employee_management')
    def employee_management():
        employees = Employee.query.all()
        return render_template('employee_management.html', employees=employees)

    @app.route('/task_management')
    def task_management():
        tasks = Task.query.all()
        return render_template('task_management.html', tasks=tasks)

    @app.route('/reports')
    def reports():
        return render_template('reports.html')

    @app.route('/api/reports/edit', methods=['POST'])
    def edit_report():
        data = request.json
        time_log_id = data['id']
        total_hours = int(data['total_hours'])
        total_minutes = int(data['total_minutes'])

        time_log = TimeLog.query.get(time_log_id)
        if time_log:
            new_duration = timedelta(hours=total_hours, minutes=total_minutes)
            time_log.update_duration(new_duration)
            try:
                db.session.commit()
                return jsonify({'status': 'success', 'message': 'Report updated successfully'})
            except Exception as e:
                db.session.rollback()
                return jsonify({'status': 'error', 'message': str(e)})
        return jsonify({'status': 'error', 'message': 'Time log not found'})

    @app.route('/api/reports/data')
    def reports_data():
        employee_hours = db.session.query(
            TimeLog.id.label('id'),
            Employee.name.label('employee_name'),
            Task.name.label('task_name'),
            Task.location.label('task_location'),
            func.sum(func.extract('epoch', TimeLog.duration) / 3600).label('total_hours'),
            func.sum(func.extract('epoch', TimeLog.duration) / 60 % 60).label('total_minutes')
        ).select_from(Employee).join(TimeLog).join(Task).group_by(TimeLog.id, Employee.id, Task.id).all()

        return jsonify([
            {
                'id': record.id,
                'employee_name': record.employee_name,
                'task_name': record.task_name,
                'task_location': record.task_location,
                'total_hours': int(record.total_hours) if record.total_hours is not None else 0,
                'total_minutes': int(record.total_minutes) if record.total_minutes is not None else 0
            }
            for record in employee_hours
        ])

    @app.route('/analytics')
    def analytics_dashboard():
        return render_template('analytics.html')

    @app.route('/api/analytics/productivity')
    def productivity_analytics():
        productivity_data = db.session.query(
            Employee.name.label('employee_name'),
            func.avg(func.extract('epoch', TimeLog.duration) / 60).label('avg_task_duration'),
            func.count(TimeLog.id).label('completed_tasks')
        ).join(TimeLog).filter(TimeLog.status == 'checked_out').group_by(Employee.id).all()

        return jsonify([
            {
                'employee_name': record.employee_name,
                'avg_task_duration': float(record.avg_task_duration) if record.avg_task_duration is not None else 0,
                'completed_tasks': int(record.completed_tasks)
            }
            for record in productivity_data
        ])

    @app.route('/api/analytics/task_completion')
    def task_completion_analytics():
        task_completion_data = db.session.query(
            Task.name.label('task_name'),
            func.count(TimeLog.id).label('completion_count'),
            func.avg(func.extract('epoch', TimeLog.duration) / 60).label('avg_duration')
        ).join(TimeLog).filter(TimeLog.status == 'checked_out').group_by(Task.id).all()

        return jsonify([
            {
                'task_name': record.task_name,
                'completion_count': int(record.completion_count),
                'avg_duration': float(record.avg_duration) if record.avg_duration is not None else 0
            }
            for record in task_completion_data
        ])

    return app
