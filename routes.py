from flask import Blueprint, jsonify, request, render_template
from models import Employee
from app import db

routes_bp = Blueprint('routes', __name__)

@routes_bp.route('/')
def index():
    return render_template('index.html')

@routes_bp.route('/employee_management')
def employee_management():
    return render_template('employee_management.html')

@routes_bp.route('/task_management')
def task_management():
    return render_template('task_management.html')

@routes_bp.route('/reports')
def reports():
    return render_template('reports.html')

@routes_bp.route('/analytics_dashboard')
def analytics_dashboard():
    return render_template('analytics.html')

@routes_bp.route('/api/employee/add', methods=['POST'])
def add_employee():
    try:
        data = request.json
        print("Received data:", data)  # Debug print
        
        required_fields = ['name', 'employee_id', 'department', 'phone_number']
        if not all(field in data for field in required_fields):
            return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
        
        new_employee = Employee(
            name=data['name'],
            employee_id=data['employee_id'],
            department=data['department'],
            phone_number=data['phone_number']
        )
        db.session.add(new_employee)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Employee added successfully'})
    except Exception as e:
        db.session.rollback()
        print("Error adding employee:", str(e))  # Debug print
        return jsonify({'status': 'error', 'message': 'An error occurred while adding the employee'}), 500

def init_routes(app):
    app.register_blueprint(routes_bp)
