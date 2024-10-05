from flask import render_template, request, jsonify
from models import Employee, Task, TimeLog
from datetime import datetime
from sqlalchemy import func, desc
from app import db

def init_routes(app):
    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/employee_management')
    def employee_management():
        return render_template('employee_management.html')

    @app.route('/api/employees/search')
    def search_employees():
        search_term = request.args.get('term', '')
        department = request.args.get('department', '')
        page = request.args.get('page', 1, type=int)
        sort_field = request.args.get('sort_field', 'id')
        sort_order = request.args.get('sort_order', 'asc')
        per_page = 10

        query = Employee.query

        if search_term:
            query = query.filter(
                (Employee.name.ilike(f'%{search_term}%')) |
                (Employee.employee_id.ilike(f'%{search_term}%'))
            )

        if department:
            query = query.filter(Employee.department == department)

        if sort_order == 'desc':
            query = query.order_by(desc(getattr(Employee, sort_field)))
        else:
            query = query.order_by(getattr(Employee, sort_field))

        employees = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'employees': [{'id': e.id, 'name': e.name, 'employee_id': e.employee_id, 'department': e.department} for e in employees.items],
            'total_pages': employees.pages,
            'current_page': page
        })

    @app.route('/task_management')
    def task_management():
        tasks = Task.query.all()
        return render_template('task_management.html', tasks=tasks)

    @app.route('/api/employee/add', methods=['POST'])
    def add_employee():
        data = request.json
        new_employee = Employee(name=data['name'], employee_id=data['employee_id'], department=data['department'])
        db.session.add(new_employee)
        try:
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Employee added successfully'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': str(e)})

    @app.route('/api/employee/update/<int:id>', methods=['PUT'])
    def update_employee(id):
        data = request.json
        employee = Employee.query.get(id)
        if employee:
            employee.name = data['name']
            employee.employee_id = data['employee_id']
            employee.department = data['department']
            try:
                db.session.commit()
                return jsonify({'status': 'success', 'message': 'Employee updated successfully'})
            except Exception as e:
                db.session.rollback()
                return jsonify({'status': 'error', 'message': str(e)})
        return jsonify({'status': 'error', 'message': 'Employee not found'})

    @app.route('/api/employee/delete/<int:id>', methods=['DELETE'])
    def delete_employee(id):
        employee = Employee.query.get(id)
        if employee:
            db.session.delete(employee)
            try:
                db.session.commit()
                return jsonify({'status': 'success', 'message': 'Employee deleted successfully'})
            except Exception as e:
                db.session.rollback()
                return jsonify({'status': 'error', 'message': str(e)})
        return jsonify({'status': 'error', 'message': 'Employee not found'})

    @app.route('/api/employee/check_in', methods=['POST'])
    def employee_check_in():
        data = request.json
        employee = Employee.query.filter_by(employee_id=data['employee_id']).first()
        task = Task.query.filter_by(barcode=data['barcode']).first()
        
        if employee and task:
            time_log = TimeLog(employee_id=employee.id, task_id=task.id, status='checked_in')
            db.session.add(time_log)
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Check-in successful'})
        else:
            return jsonify({'status': 'error', 'message': 'Invalid employee ID or barcode'})

    @app.route('/api/employee/check_out', methods=['POST'])
    def employee_check_out():
        data = request.json
        employee = Employee.query.filter_by(employee_id=data['employee_id']).first()
        
        if employee:
            time_log = TimeLog.query.filter_by(employee_id=employee.id, end_time=None, status='checked_in').order_by(TimeLog.start_time.desc()).first()
            if time_log:
                time_log.end_time = datetime.utcnow()
                time_log.duration = time_log.end_time - time_log.start_time
                time_log.status = 'checked_out'
                db.session.commit()
                return jsonify({'status': 'success', 'message': 'Check-out successful'})
            else:
                return jsonify({'status': 'error', 'message': 'No active check-in found'})
        else:
            return jsonify({'status': 'error', 'message': 'Invalid employee ID'})

    @app.route('/api/task/add', methods=['POST'])
    def add_task():
        data = request.json
        new_task = Task(name=data['name'], task_id=data['task_id'], barcode=data['barcode'])
        db.session.add(new_task)
        try:
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Task added successfully'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': str(e)})

    @app.route('/api/task/update/<int:id>', methods=['PUT'])
    def update_task(id):
        data = request.json
        task = Task.query.get(id)
        if task:
            task.name = data['name']
            task.task_id = data['task_id']
            task.barcode = data['barcode']
            task.location = data['location']  # Add this line to update the location
            try:
                db.session.commit()
                return jsonify({'status': 'success', 'message': 'Task updated successfully'})
            except Exception as e:
                db.session.rollback()
                return jsonify({'status': 'error', 'message': str(e)})
        return jsonify({'status': 'error', 'message': 'Task not found'})

    @app.route('/api/task/delete/<int:id>', methods=['DELETE'])
    def delete_task(id):
        task = Task.query.get(id)
        if task:
            db.session.delete(task)
            try:
                db.session.commit()
                return jsonify({'status': 'success', 'message': 'Task deleted successfully'})
            except Exception as e:
                db.session.rollback()
                return jsonify({'status': 'error', 'message': str(e)})
        return jsonify({'status': 'error', 'message': 'Task not found'})

    @app.route('/reports')
    def reports():
        return render_template('reports.html')

    @app.route('/api/reports/data')
    def reports_data():
        employee_hours = db.session.query(
            Employee.name.label('employee_name'),
            Task.name.label('task_name'),
            Task.location.label('task_location'),
            func.sum(func.extract('epoch', TimeLog.duration) / 60).label('total_minutes'),
            func.sum(func.extract('epoch', TimeLog.duration) % 60).label('total_seconds')
        ).select_from(Employee).join(TimeLog).join(Task).group_by(Employee.id, Task.id).all()

        return jsonify([
            {
                'employee_name': record.employee_name,
                'task_name': record.task_name,
                'task_location': record.task_location,
                'total_minutes': int(record.total_minutes),
                'total_seconds': int(record.total_seconds)
            }
            for record in employee_hours
        ])

    @app.route('/api/scan', methods=['POST'])
    def handle_scan():
        data = request.json
        scanned_value = data['scanned_value']

        if scanned_value.startswith('E'):
            return handle_employee_scan(scanned_value)
        else:
            return handle_task_scan(scanned_value)

    def handle_employee_scan(employee_id):
        employee = Employee.query.filter_by(employee_id=employee_id).first()
        if not employee:
            return jsonify({'status': 'error', 'message': 'Employee not found'})

        active_time_log = TimeLog.query.filter_by(employee_id=employee.id, end_time=None, status='checked_in').first()
        if active_time_log:
            active_time_log.end_time = datetime.utcnow()
            active_time_log.duration = active_time_log.end_time - active_time_log.start_time
            active_time_log.status = 'checked_out'
            db.session.commit()
            return jsonify({'status': 'success', 'message': f'Employee {employee.name} checked out successfully'})
        else:
            return jsonify({'status': 'success', 'message': f'Employee {employee.name} scanned. Please scan a task barcode to check in.'})

    def handle_task_scan(barcode):
        task = Task.query.filter_by(barcode=barcode).first()
        if not task:
            return jsonify({'status': 'error', 'message': 'Task not found'})

        active_time_log = TimeLog.query.filter_by(end_time=None, status='checked_in').order_by(TimeLog.start_time.desc()).first()
        if not active_time_log:
            return jsonify({'status': 'error', 'message': 'No active employee check-in found. Please scan an employee ID first.'})

        if active_time_log.task_id == task.id:
            active_time_log.end_time = datetime.utcnow()
            active_time_log.duration = active_time_log.end_time - active_time_log.start_time
            active_time_log.status = 'checked_out'
            db.session.commit()
            return jsonify({'status': 'success', 'message': f'Task {task.name} stopped successfully'})
        else:
            new_time_log = TimeLog(employee_id=active_time_log.employee_id, task_id=task.id, status='checked_in')
            db.session.add(new_time_log)
            db.session.commit()
            return jsonify({'status': 'success', 'message': f'Task {task.name} started successfully'})