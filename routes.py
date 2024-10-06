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

    @app.route('/api/scan', methods=['POST'])
    def handle_scan():
        data = request.json
        scanned_value = data.get('scanned_value')
        if scanned_value.startswith('E'):
            return jsonify({'status': 'success', 'type': 'employee'})
        elif scanned_value.startswith('T'):
            return jsonify({'status': 'success', 'type': 'task'})
        else:
            return jsonify({'status': 'error', 'message': 'Invalid barcode'})

    @app.route('/employee_history/<string:employee_id>')
    def employee_history(employee_id):
        employee = Employee.query.filter(
            (Employee.employee_id == employee_id) | 
            (Employee.employee_id == employee_id.lstrip('E'))
        ).first()
        if employee:
            time_logs = TimeLog.query.filter_by(employee_id=employee.id).order_by(TimeLog.start_time.desc()).all()
            return render_template('employee_history.html', employee=employee, time_logs=time_logs)
        return "Employee not found", 404

    @app.route('/task_history/<string:task_id>')
    def task_history(task_id):
        task = Task.query.filter(
            (Task.task_id == task_id) | 
            (Task.task_id == task_id.lstrip('T'))
        ).first()
        if task:
            time_logs = TimeLog.query.filter_by(task_id=task.id).order_by(TimeLog.start_time.desc()).all()
            return render_template('task_history.html', task=task, time_logs=time_logs)
        return "Task not found", 404

    @app.route('/api/employee/check_in', methods=['POST'])
    def employee_check_in():
        data = request.json
        employee_id = data.get('employee_id')
        task_barcode = data.get('task_barcode')
        
        employee = Employee.query.filter_by(employee_id=employee_id).first()
        task = Task.query.filter_by(barcode=task_barcode).first()
        
        if not employee or not task:
            return jsonify({'status': 'error', 'message': 'Invalid employee ID or task barcode'}), 400
        
        active_check_in = TimeLog.query.filter_by(employee_id=employee.id, end_time=None, status='checked_in').first()
        if active_check_in:
            return jsonify({'status': 'error', 'message': 'Employee already checked in'}), 400
        
        time_log = TimeLog(employee_id=employee.id, task_id=task.id, status='checked_in')
        db.session.add(time_log)
        
        try:
            db.session.commit()
            emit_analytics_update(app.extensions['socketio'])
            return jsonify({'status': 'success', 'message': 'Check-in successful'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': str(e)}), 500

    @app.route('/api/employee/check_out', methods=['POST'])
    def employee_check_out():
        data = request.json
        employee_id = data.get('employee_id')
        
        employee = Employee.query.filter_by(employee_id=employee_id).first()
        
        if not employee:
            return jsonify({'status': 'error', 'message': 'Invalid employee ID'}), 400
        
        time_log = TimeLog.query.filter_by(employee_id=employee.id, end_time=None, status='checked_in').order_by(TimeLog.start_time.desc()).first()
        
        if not time_log:
            return jsonify({'status': 'error', 'message': 'No active check-in found'}), 400
        
        time_log.end_time = datetime.utcnow()
        time_log.duration = time_log.end_time - time_log.start_time
        time_log.status = 'checked_out'
        
        try:
            db.session.commit()
            emit_analytics_update(app.extensions['socketio'])
            
            if twilio_client and employee.phone_number:
                try:
                    message = twilio_client.messages.create(
                        body=f"Employee {employee.name} (ID: {employee.employee_id}) has checked out at {time_log.end_time.strftime('%Y-%m-%d %H:%M:%S')}",
                        from_=twilio_phone_number,
                        to=employee.phone_number
                    )
                    return jsonify({'status': 'success', 'message': 'Check-out successful and SMS notification sent'}), 200
                except TwilioRestException as e:
                    print(f"Error sending SMS: {str(e)}")
                    return jsonify({'status': 'success', 'message': 'Check-out successful, but SMS notification failed'}), 200
            else:
                return jsonify({'status': 'success', 'message': 'Check-out successful (SMS notification not configured)'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': str(e)}), 500

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
        
        if time_log.bathroom_break_start and not time_log.bathroom_break_end:
            time_log.bathroom_break_end = datetime.utcnow()
            bathroom_break_duration = time_log.bathroom_break_end - time_log.bathroom_break_start
            bathroom_break_status = 'Out'
        else:
            time_log.bathroom_break_start = datetime.utcnow()
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
                'bathroom_break_duration': str(bathroom_break_duration) if bathroom_break_duration else None
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': str(e)}), 500

    @app.route('/api/employees/search')
    def search_employees():
        term = request.args.get('term', '')
        page = int(request.args.get('page', 1))
        sort_field = request.args.get('sort_field', 'id')
        sort_order = request.args.get('sort_order', 'asc')

        query = Employee.query

        if term:
            query = query.filter(or_(
                Employee.name.ilike(f'%{term}%'),
                Employee.employee_id.ilike(f'%{term}%'),
                Employee.phone_number.ilike(f'%{term}%')
            ))

        if sort_order == 'asc':
            query = query.order_by(getattr(Employee, sort_field).asc())
        else:
            query = query.order_by(getattr(Employee, sort_field).desc())

        employees = query.paginate(page=page, per_page=10, error_out=False)

        return jsonify({
            'employees': [{
                'id': e.id,
                'name': e.name,
                'employee_id': e.employee_id,
                'department': e.department,
                'phone_number': e.phone_number
            } for e in employees.items],
            'total_pages': employees.pages,
            'current_page': page
        })

    @app.route('/api/employee/add', methods=['POST'])
    def add_employee():
        data = request.json
        new_employee = Employee(
            name=data['name'],
            employee_id=data['employee_id'],
            department=data['department'],
            phone_number=data['phone_number']
        )
        db.session.add(new_employee)
        try:
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Employee added successfully'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': str(e)})

    @app.route('/api/employee/update/<int:id>', methods=['PUT'])
    def update_employee(id):
        employee = Employee.query.get(id)
        if employee:
            data = request.json
            employee.name = data['name']
            employee.employee_id = data['employee_id']
            employee.department = data['department']
            employee.phone_number = data['phone_number']
            try:
                db.session.commit()
                return jsonify({'status': 'success', 'message': 'Employee updated successfully'})
            except Exception as e:
                db.session.rollback()
                return jsonify({'status': 'error', 'message': str(e)})
        return jsonify({'status': 'error', 'message': 'Employee not found'}), 404

    @app.route('/api/employee/delete/<int:id>', methods=['DELETE'])
    def delete_employee(id):
        employee = Employee.query.get(id)
        if employee:
            db.session.delete(employee)
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Employee deleted successfully'})
        return jsonify({'status': 'error', 'message': 'Employee not found'}), 404

    @app.route('/analytics')
    def analytics_dashboard():
        return render_template('analytics.html')

    @app.route('/api/reports/data')
    def get_report_data():
        time_logs = TimeLog.query.order_by(TimeLog.start_time.desc()).all()
        report_data = []
        for log in time_logs:
            bathroom_break_duration = None
            if log.bathroom_break_start and log.bathroom_break_end:
                bathroom_break_duration = (log.bathroom_break_end - log.bathroom_break_start).total_seconds() / 60
            
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
                'bathroom_break_duration': round(bathroom_break_duration, 2) if bathroom_break_duration is not None else None,
                'total_hours': log.duration.total_seconds() // 3600 if log.duration else 0,
                'total_minutes': (log.duration.total_seconds() % 3600) // 60 if log.duration else 0
            })
        return jsonify(report_data)

    @app.route('/api/reports/delete/<int:id>', methods=['DELETE'])
    def delete_report(id):
        time_log = TimeLog.query.get(id)
        if time_log:
            db.session.delete(time_log)
            try:
                db.session.commit()
                emit_analytics_update(app.extensions['socketio'])
                return jsonify({'status': 'success', 'message': 'Report deleted successfully'})
            except Exception as e:
                db.session.rollback()
                return jsonify({'status': 'error', 'message': str(e)}), 500
        return jsonify({'status': 'error', 'message': 'Report not found'}), 404

    return app