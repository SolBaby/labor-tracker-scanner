from flask import jsonify, request, render_template
from app import db
from models import Employee, Task, TimeLog
from sqlalchemy import func
from datetime import timedelta, datetime
from analytics import init_analytics, emit_analytics_update

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
            emit_analytics_update()  # Add this line
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
            emit_analytics_update()  # Add this line
            return jsonify({'status': 'success', 'message': 'Check-out successful'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': str(e)}), 500

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

    @app.route('/api/reports/delete/<int:id>', methods=['DELETE'])
    def delete_report(id):
        time_log = TimeLog.query.get(id)
        if time_log:
            try:
                db.session.delete(time_log)
                db.session.commit()
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
        else:
            sort_expr = Employee.name  # Default sort

        query = query.order_by(sort_expr.desc() if sort_order == 'desc' else sort_expr)

        employee_hours = query.all()

        return jsonify([
            {
                'id': record.id,
                'employee_name': record.employee_name,
                'task_name': record.task_name,
                'task_location': record.task_location,
                'check_in_time': record.check_in_time.isoformat() if record.check_in_time else None,
                'total_hours': int(record.total_hours) if record.total_hours is not None else 0,
                'total_minutes': int(record.total_minutes) if record.total_minutes is not None else 0
            }
            for record in employee_hours
        ])

    @app.route('/analytics')
    def analytics_dashboard():
        return render_template('analytics.html')

    return app
