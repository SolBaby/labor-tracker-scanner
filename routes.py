from flask import render_template, request, jsonify
from app import app, db
from models import Employee, Task, TimeLog
from datetime import datetime
from sqlalchemy import func

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

@app.route('/reports')
def reports():
    # Example: Get total hours worked by each employee
    employee_hours = db.session.query(
        Employee.name,
        func.sum(TimeLog.duration)
    ).join(TimeLog).group_by(Employee.id).all()

    # Example: Get total time spent on each task
    task_hours = db.session.query(
        Task.name,
        func.sum(TimeLog.duration)
    ).join(TimeLog).group_by(Task.id).all()

    return render_template('reports.html', employee_hours=employee_hours, task_hours=task_hours)
