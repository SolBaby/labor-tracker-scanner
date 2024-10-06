from flask import jsonify, request, render_template, redirect, url_for
from app import db
from models import Employee, Task, TimeLog
from sqlalchemy import func, or_
from datetime import timedelta, datetime
from analytics import init_analytics, emit_analytics_update
import os

# Initialize Twilio client only if credentials are available
twilio_client = None
try:
    from twilio.rest import Client
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    twilio_phone_number = os.environ.get('TWILIO_PHONE_NUMBER')
    if account_sid and auth_token:
        twilio_client = Client(account_sid, auth_token)
except ImportError:
    print("Twilio library not installed. SMS notifications will not be available.")
except Exception as e:
    print(f"Error initializing Twilio client: {str(e)}")

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
            
            # Send SMS notification if Twilio is configured
            if twilio_client and employee.phone_number:
                try:
                    message = twilio_client.messages.create(
                        body=f"Employee {employee.name} (ID: {employee.employee_id}) has checked out at {time_log.end_time.strftime('%Y-%m-%d %H:%M:%S')}",
                        from_=twilio_phone_number,
                        to=employee.phone_number
                    )
                    return jsonify({'status': 'success', 'message': 'Check-out successful and SMS notification sent'}), 200
                except Exception as e:
                    print(f"Error sending SMS: {str(e)}")
                    return jsonify({'status': 'success', 'message': 'Check-out successful, but SMS notification failed'}), 200
            else:
                return jsonify({'status': 'success', 'message': 'Check-out successful (SMS notification not configured)'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': str(e)}), 500

    @app.route('/api/employee/lunch_break', methods=['POST'])
    def employee_lunch_break():
        data = request.json
        employee_id = data.get('employee_id')
        
        employee = Employee.query.filter_by(employee_id=employee_id).first()
        
        if not employee:
            return jsonify({'status': 'error', 'message': 'Invalid employee ID'}), 400
        
        time_log = TimeLog.query.filter_by(employee_id=employee.id, end_time=None, status='checked_in').order_by(TimeLog.start_time.desc()).first()
        
        if not time_log:
            return jsonify({'status': 'error', 'message': 'No active check-in found'}), 400
        
        if time_log.lunch_break_start and not time_log.lunch_break_end:
            time_log.lunch_break_end = datetime.utcnow()
            lunch_break_status = 'Out'
            message = 'Lunch break ended'
        else:
            time_log.lunch_break_start = datetime.utcnow()
            time_log.lunch_break_end = None
            lunch_break_status = 'In'
            message = 'Lunch break started'
        
        try:
            db.session.commit()
            emit_analytics_update(app.extensions['socketio'])
            return jsonify({'status': 'success', 'message': message, 'lunch_break_status': lunch_break_status}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': str(e)}), 500

    @app.route('/api/employee/bathroom_break', methods=['POST'])
    def employee_bathroom_break():
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
            bathroom_break_status = 'Out'
            message = 'Bathroom break ended'
        else:
            time_log.bathroom_break_start = datetime.utcnow()
            time_log.bathroom_break_end = None
            bathroom_break_status = 'In'
            message = 'Bathroom break started'
        
        try:
            db.session.commit()
            emit_analytics_update(app.extensions['socketio'])
            return jsonify({'status': 'success', 'message': message, 'bathroom_break_status': bathroom_break_status}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': str(e)}), 500

    @app.route('/api/employee/delete/<int:id>', methods=['DELETE'])
    def delete_employee(id):
        employee = Employee.query.get(id)
        if employee:
            db.session.delete(employee)
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Employee deleted successfully'})
        return jsonify({'status': 'error', 'message': 'Employee not found'}), 404

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
                emit_analytics_update(app.extensions['socketio'])
                return jsonify({'status': 'success', 'message': 'Report updated successfully'})
            except Exception as e:
                db.session.rollback()
                return jsonify({'status': 'error', 'message': str(e)})
        return jsonify({'status': 'error', 'message': 'Time log not found'})

    @app.route('/api/reports/delete/<int:id>', methods=['DELETE'])
    def delete_report(id):
        time_log = TimeLog.query.get(id)
        if time_log:
            try:
                db.session.delete(time_log)
                db.session.commit()
                emit_analytics_update(app.extensions['socketio'])
                return jsonify({'status': 'success', 'message': 'Report deleted successfully'})
            except Exception as e:
                db.session.rollback()
                return jsonify({'status': 'error', 'message': str(e)})
        return jsonify({'status': 'error', 'message': 'Time log not found'})

    @app.route('/api/reports/data')
    def reports_data():
        sort_field = request.args.get('sort_field', 'employee_name')
        sort_order = request.args.get('sort_order', 'asc')

        query = db.session.query(
            TimeLog.id.label('id'),
            Employee.name.label('employee_name'),
            Task.name.label('task_name'),
            Task.location.label('task_location'),
            TimeLog.start_time.label('check_in_time'),
            TimeLog.end_time.label('check_out_time'),
            TimeLog.lunch_break_start.label('lunch_break_start'),
            TimeLog.lunch_break_end.label('lunch_break_end'),
            TimeLog.bathroom_break_start.label('bathroom_break_start'),
            TimeLog.bathroom_break_end.label('bathroom_break_end'),
            func.sum(func.extract('epoch', TimeLog.duration) / 3600).label('total_hours'),
            func.sum(func.extract('epoch', TimeLog.duration) / 60 % 60).label('total_minutes')
        ).select_from(Employee).join(TimeLog).join(Task).group_by(TimeLog.id, Employee.id, Task.id)

        if sort_field == 'total_time':
            sort_expr = (func.sum(func.extract('epoch', TimeLog.duration) / 3600) * 60 +
                         func.sum(func.extract('epoch', TimeLog.duration) / 60 % 60))
        elif sort_field == 'employee_name':
            sort_expr = Employee.name
        elif sort_field == 'task_name':
            sort_expr = Task.name
        elif sort_field == 'task_location':
            sort_expr = Task.location
        elif sort_field == 'check_in_time':
            sort_expr = TimeLog.start_time
        elif sort_field == 'check_out_time':
            sort_expr = TimeLog.end_time
        elif sort_field == 'lunch_break_start':
            sort_expr = TimeLog.lunch_break_start
        elif sort_field == 'lunch_break_end':
            sort_expr = TimeLog.lunch_break_end
        else:
            sort_expr = Employee.name

        query = query.order_by(sort_expr.desc() if sort_order == 'desc' else sort_expr)

        employee_hours = query.all()

        return jsonify([
            {
                'id': record.id,
                'employee_name': record.employee_name,
                'task_name': record.task_name,
                'task_location': record.task_location,
                'check_in_time': record.check_in_time.isoformat() if record.check_in_time else None,
                'check_out_time': record.check_out_time.isoformat() if record.check_out_time else None,
                'lunch_break_start': record.lunch_break_start.isoformat() if record.lunch_break_start else None,
                'lunch_break_end': record.lunch_break_end.isoformat() if record.lunch_break_end else None,
                'bathroom_break_start': record.bathroom_break_start.isoformat() if record.bathroom_break_start else None,
                'bathroom_break_end': record.bathroom_break_end.isoformat() if record.bathroom_break_end else None,
                'total_hours': int(record.total_hours) if record.total_hours is not None else 0,
                'total_minutes': int(record.total_minutes) if record.total_minutes is not None else 0
            }
            for record in employee_hours
        ])

    @app.route('/analytics')
    def analytics_dashboard():
        return render_template('analytics.html')

    return app