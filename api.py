from flask import Blueprint
from flask_restful import Api, Resource, reqparse
from models import Employee, Task, TimeLog
from app import db
from datetime import datetime

api_bp = Blueprint('api', __name__)
api = Api(api_bp)

class EmployeeResource(Resource):
    def get(self, employee_id):
        employee = Employee.query.filter_by(employee_id=employee_id).first()
        if employee:
            return {'id': employee.id, 'name': employee.name, 'employee_id': employee.employee_id, 'department': employee.department}
        return {'message': 'Employee not found'}, 404

class TaskResource(Resource):
    def get(self, task_id):
        task = Task.query.filter_by(task_id=task_id).first()
        if task:
            return {'id': task.id, 'name': task.name, 'task_id': task.task_id, 'barcode': task.barcode, 'location': task.location}
        return {'message': 'Task not found'}, 404

class CheckInResource(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('employee_id', type=str, required=True)
        parser.add_argument('task_id', type=str, required=True)
        args = parser.parse_args()

        employee = Employee.query.filter_by(employee_id=args['employee_id']).first()
        task = Task.query.filter_by(task_id=args['task_id']).first()

        if employee and task:
            time_log = TimeLog(employee_id=employee.id, task_id=task.id, status='checked_in')
            db.session.add(time_log)
            db.session.commit()
            return {'message': 'Check-in successful'}, 201
        return {'message': 'Invalid employee ID or task ID'}, 400

class CheckOutResource(Resource):
    def get(self):
        return {'message': 'Use POST method to check out'}, 405

    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('employee_id', type=str, required=True)
        args = parser.parse_args()

        employee = Employee.query.filter_by(employee_id=args['employee_id']).first()

        if employee:
            time_log = TimeLog.query.filter_by(employee_id=employee.id, end_time=None, status='checked_in').order_by(TimeLog.start_time.desc()).first()
            if time_log:
                time_log.end_time = datetime.utcnow()
                time_log.duration = time_log.end_time - time_log.start_time
                time_log.status = 'checked_out'
                db.session.commit()
                return {'status': 'success', 'message': 'Check-out successful'}, 200
            return {'status': 'error', 'message': 'No active check-in found'}, 400
        return {'status': 'error', 'message': 'Invalid employee ID'}, 400

api.add_resource(EmployeeResource, '/api/employee/<string:employee_id>')
api.add_resource(TaskResource, '/api/task/<string:task_id>')
api.add_resource(CheckInResource, '/api/checkin')
api.add_resource(CheckOutResource, '/api/checkout')

def init_api(app):
    app.register_blueprint(api_bp)
