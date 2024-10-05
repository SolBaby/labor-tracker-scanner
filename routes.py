from flask import render_template, request, jsonify
from models import Employee, Task, TimeLog
from datetime import datetime
from sqlalchemy import func
from app import db

def init_routes(app):
    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/employee_management')
    def employee_management():
        page = request.args.get('page', 1, type=int)
        per_page = 10
        employees = Employee.query.paginate(page=page, per_page=per_page, error_out=False)
        return render_template('employee_management.html', employees=employees.items, page=page, total_pages=employees.pages)

    @app.route('/api/employees/search')
    def search_employees():
        search_term = request.args.get('term', '')
        page = request.args.get('page', 1, type=int)
        per_page = 10
        employees = Employee.query.filter(
            (Employee.name.ilike(f'%{search_term}%')) |
            (Employee.employee_id.ilike(f'%{search_term}%'))
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'employees': [{'id': e.id, 'name': e.name, 'employee_id': e.employee_id} for e in employees.items],
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
        new_employee = Employee(name=data['name'], employee_id=data['employee_id'])
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
        task = Task.query.filter_by(task_id=data['task_id']).first()
        
        if employee and task:
            time_log = TimeLog(employee_id=employee.id, task_id=task.id)
            db.session.add(time_log)
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Check-in successful'})
        else:
            return jsonify({'status': 'error', 'message': 'Invalid employee or task ID'})

    @app.route('/api/employee/check_out', methods=['POST'])
    def employee_check_out():
        data = request.json
        employee = Employee.query.filter_by(employee_id=data['employee_id']).first()
        
        if employee:
            time_log = TimeLog.query.filter_by(employee_id=employee.id, end_time=None).order_by(TimeLog.start_time.desc()).first()
            if time_log:
                time_log.end_time = datetime.utcnow()
                time_log.duration = time_log.end_time - time_log.start_time
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

    @app.route('/reports')
    def reports():
        employee_hours = db.session.query(
            Employee.name,
            func.sum(TimeLog.duration)
        ).join(TimeLog).group_by(Employee.id).all()

        task_hours = db.session.query(
            Task.name,
            func.sum(TimeLog.duration)
        ).join(TimeLog).group_by(Task.id).all()

        return render_template('reports.html', employee_hours=employee_hours, task_hours=task_hours)
