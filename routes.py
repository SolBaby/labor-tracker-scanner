from flask import jsonify, request, render_template, redirect, url_for
from models import Employee, Task, TimeLog
from sqlalchemy import func, or_
from datetime import timedelta, datetime
from analytics import emit_analytics_update
import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

def init_routes(app, db):
    @app.route('/history')
    def history():
        return render_template('history.html')

    @app.route('/api/history/data')
    def get_history_data():
        employee_id = request.args.get('employee_id')
        task_id = request.args.get('task_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        query = TimeLog.query.join(Employee).join(Task)

        if employee_id:
            query = query.filter(Employee.employee_id == employee_id)
        if task_id:
            query = query.filter(Task.task_id == task_id)
        if start_date:
            query = query.filter(TimeLog.start_time >= datetime.strptime(start_date, '%Y-%m-%d'))
        if end_date:
            query = query.filter(TimeLog.start_time <= datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1))

        time_logs = query.order_by(TimeLog.start_time.desc()).all()

        history_data = []
        for log in time_logs:
            history_data.append({
                'employee_name': log.employee.name,
                'employee_id': log.employee.employee_id,
                'task_name': log.task.name,
                'task_id': log.task.task_id,
                'check_in_time': log.start_time.isoformat() if log.start_time else None,
                'check_out_time': log.end_time.isoformat() if log.end_time else None,
                'lunch_break_start': log.lunch_break_start.isoformat() if log.lunch_break_start else None,
                'lunch_break_end': log.lunch_break_end.isoformat() if log.lunch_break_end else None,
                'bathroom_break_start': log.bathroom_break_start.isoformat() if log.bathroom_break_start else None,
                'bathroom_break_end': log.bathroom_break_end.isoformat() if log.bathroom_break_end else None,
                'duration': str(log.duration) if log.duration else None,
            })

        return jsonify(history_data)

    @app.route('/api/history/summary')
    def get_history_summary():
        employee_id = request.args.get('employee_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        query = db.session.query(
            Employee.name,
            Employee.employee_id,
            func.sum(TimeLog.duration),
            func.sum(TimeLog.lunch_break_end - TimeLog.lunch_break_start),
            func.sum(TimeLog.bathroom_break_end - TimeLog.bathroom_break_start)
        ).join(TimeLog)

        if employee_id:
            query = query.filter(Employee.employee_id == employee_id)
        if start_date:
            query = query.filter(TimeLog.start_time >= datetime.strptime(start_date, '%Y-%m-%d'))
        if end_date:
            query = query.filter(TimeLog.start_time <= datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1))

        query = query.group_by(Employee.id)

        summary_data = []
        for result in query.all():
            summary_data.append({
                'employee_name': result[0],
                'employee_id': result[1],
                'total_work_hours': str(result[2]) if result[2] else '0:00:00',
                'total_lunch_break': str(result[3]) if result[3] else '0:00:00',
                'total_bathroom_break': str(result[4]) if result[4] else '0:00:00',
            })

        return jsonify(summary_data)

    # Add other routes here

    return app
