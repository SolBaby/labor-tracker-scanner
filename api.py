from flask import Blueprint
from flask_restful import Api, Resource, reqparse
from models import Employee, Task
from app import db

api_bp = Blueprint('api', __name__)
api = Api(api_bp)

class CreateEmployeeResource(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('name', type=str, required=True)
        parser.add_argument('employee_id', type=str, required=True)
        parser.add_argument('department', type=str, required=True)
        parser.add_argument('phone_number', type=str)
        parser.add_argument('task_id', type=str)
        args = parser.parse_args()

        existing_employee = Employee.query.filter_by(employee_id=args['employee_id']).first()
        if existing_employee:
            return {'status': 'error', 'message': 'Employee ID already exists'}, 400

        new_employee = Employee(
            name=args['name'],
            employee_id=args['employee_id'],
            department=args['department'],
            phone_number=args.get('phone_number')
        )

        if args.get('task_id'):
            task = Task.query.filter_by(task_id=args['task_id']).first()
            if task:
                new_employee.task_id = task.id
            else:
                return {'status': 'error', 'message': f"Invalid task ID: {args['task_id']}"}, 400

        db.session.add(new_employee)
        try:
            db.session.commit()
            return {'status': 'success', 'message': 'Employee added successfully', 'id': new_employee.id}, 201
        except Exception as e:
            db.session.rollback()
            return {'status': 'error', 'message': f"Error adding employee: {str(e)}"}, 500

api.add_resource(CreateEmployeeResource, '/employee/add')

def init_api(app):
    app.register_blueprint(api_bp, url_prefix='/api')
