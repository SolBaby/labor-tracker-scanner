from flask_socketio import emit
from models import Employee, Task, TimeLog
from sqlalchemy import func
from app import db
import json
from datetime import datetime, timedelta

def init_analytics(app, socketio):
    @socketio.on('connect', namespace='/ws/analytics')
    def handle_connect():
        print('Client connected to analytics websocket')
        emit_analytics_data()

    @socketio.on('disconnect', namespace='/ws/analytics')
    def handle_disconnect():
        print('Client disconnected from analytics websocket')

    def emit_analytics_data():
        productivity_data = get_productivity_data()
        task_completion_data = get_task_completion_data()
        department_performance_data = get_department_performance_data()
        real_time_data = get_real_time_data()

        emit('analytics_update', {
            'productivity': productivity_data,
            'task_completion': task_completion_data,
            'department_performance': department_performance_data,
            'real_time': real_time_data
        }, namespace='/ws/analytics', broadcast=True)

    def get_productivity_data():
        productivity_data = db.session.query(
            Employee.name.label('employee_name'),
            Employee.department.label('department'),
            func.avg(func.extract('epoch', TimeLog.duration) / 60).label('avg_task_duration'),
            func.count(TimeLog.id).label('completed_tasks')
        ).join(TimeLog).filter(TimeLog.status == 'checked_out').group_by(Employee.id).all()

        return [
            {
                'employee_name': record.employee_name,
                'department': record.department,
                'avg_task_duration': float(record.avg_task_duration) if record.avg_task_duration is not None else 0,
                'completed_tasks': int(record.completed_tasks)
            }
            for record in productivity_data
        ]

    def get_task_completion_data():
        task_completion_data = db.session.query(
            Task.name.label('task_name'),
            Task.location.label('location'),
            func.count(TimeLog.id).label('completion_count'),
            func.avg(func.extract('epoch', TimeLog.duration) / 60).label('avg_duration')
        ).join(TimeLog).filter(TimeLog.status == 'checked_out').group_by(Task.id).all()

        return [
            {
                'task_name': record.task_name,
                'location': record.location,
                'completion_count': int(record.completion_count),
                'avg_duration': float(record.avg_duration) if record.avg_duration is not None else 0
            }
            for record in task_completion_data
        ]

    def get_department_performance_data():
        department_data = db.session.query(
            Employee.department.label('department'),
            func.count(Employee.id).label('employee_count'),
            func.avg(func.extract('epoch', TimeLog.duration) / 60).label('avg_task_duration'),
            func.count(TimeLog.id).label('total_tasks_completed')
        ).join(TimeLog).filter(TimeLog.status == 'checked_out').group_by(Employee.department).all()

        return [
            {
                'department': record.department,
                'employee_count': int(record.employee_count),
                'avg_task_duration': float(record.avg_task_duration) if record.avg_task_duration is not None else 0,
                'total_tasks_completed': int(record.total_tasks_completed)
            }
            for record in department_data
        ]

    def get_real_time_data():
        now = datetime.utcnow()
        one_hour_ago = now - timedelta(hours=1)
        
        real_time_data = db.session.query(
            Employee.name.label('employee_name'),
            Task.name.label('task_name'),
            TimeLog.start_time.label('start_time'),
            TimeLog.status.label('status')
        ).join(Employee).join(Task).filter(
            TimeLog.start_time >= one_hour_ago
        ).order_by(TimeLog.start_time.desc()).limit(10).all()

        return [
            {
                'employee_name': record.employee_name,
                'task_name': record.task_name,
                'start_time': record.start_time.isoformat(),
                'status': record.status
            }
            for record in real_time_data
        ]

    # Schedule periodic updates (every 10 seconds)
    def schedule_updates():
        with app.app_context():
            emit_analytics_data()
        socketio.sleep(10)
        socketio.start_background_task(schedule_updates)

    socketio.start_background_task(schedule_updates)

    return app
