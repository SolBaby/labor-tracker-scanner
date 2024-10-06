from flask import jsonify, request, render_template, redirect, url_for
from app import db
from models import Employee, Task, TimeLog
from sqlalchemy import func, or_
from datetime import timedelta, datetime
from analytics import init_analytics, emit_analytics_update
import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

# Initialize Twilio client
account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
twilio_phone_number = os.environ.get('TWILIO_PHONE_NUMBER')
twilio_client = Client(account_sid, auth_token) if account_sid and auth_token else None

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

    @app.route('/api/employee/bathroom_break', methods=['POST'])
    def handle_bathroom_break():
        data = request.json
        employee_id = data.get('employee_id')
        
        employee = Employee.query.filter_by(employee_id=employee_id).first()
        
        if not employee:
            return jsonify({'status': 'error', 'message': 'Invalid employee ID'}), 400
        
        time_log = TimeLog.query.filter_by(employee_id=employee.id, end_time=None, status='checked_in').order_by(TimeLog.start_time.desc()).first()
        
        if not time_log:
            return jsonify({'status': 'error', 'message': 'No active check-in found'}), 400
        
        current_time = datetime.utcnow()
        if time_log.bathroom_break_start and not time_log.bathroom_break_end:
            time_log.bathroom_break_end = current_time
            bathroom_break_duration = time_log.bathroom_break_end - time_log.bathroom_break_start
            time_log.add_bathroom_break_duration(bathroom_break_duration)
            bathroom_break_status = 'Out'
        else:
            time_log.bathroom_break_start = current_time
            time_log.bathroom_break_end = None
            bathroom_break_duration = None
            bathroom_break_status = 'In'
        
        try:
            db.session.commit()
            emit_analytics_update(app.extensions['socketio'])
            return jsonify({
                'status': 'success',
                'message': f'Bathroom break {bathroom_break_status}',
                'bathroom_break_status': bathroom_break_status,
                'bathroom_break_duration': str(bathroom_break_duration) if bathroom_break_duration else None,
                'total_bathroom_break_duration': str(time_log.total_bathroom_break_duration)
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': str(e)}), 500

    @app.route('/api/reports/data')
    def get_report_data():
        time_logs = TimeLog.query.order_by(TimeLog.start_time.desc()).all()
        report_data = []
        for log in time_logs:
            report_data.append({
                'id': log.id,
                'employee_name': log.employee.name,
                'task_name': log.task.name,
                'task_location': log.task.location,
                'check_in_time': log.start_time.isoformat() if log.start_time else None,
                'check_out_time': log.end_time.isoformat() if log.end_time else None,
                'lunch_break_start': log.lunch_break_start.isoformat() if log.lunch_break_start else None,
                'lunch_break_end': log.lunch_break_end.isoformat() if log.lunch_break_end else None,
                'bathroom_break_start': log.bathroom_break_start.isoformat() if log.bathroom_break_start else None,
                'bathroom_break_end': log.bathroom_break_end.isoformat() if log.bathroom_break_end else None,
                'total_bathroom_break_duration': str(log.total_bathroom_break_duration) if log.total_bathroom_break_duration else '0:00:00',
                'total_hours': log.duration.total_seconds() // 3600 if log.duration else 0,
                'total_minutes': (log.duration.total_seconds() % 3600) // 60 if log.duration else 0
            })
        return jsonify(report_data)

    # Keep the remaining route definitions...

    return app
