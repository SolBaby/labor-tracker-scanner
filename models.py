from app import db
from datetime import datetime, timedelta

class Employee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    employee_id = db.Column(db.String(20), unique=True, nullable=False)
    department = db.Column(db.String(50), nullable=False)
    phone_number = db.Column(db.String(20), nullable=True)
    time_logs = db.relationship('TimeLog', backref='employee', lazy=True)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    task_id = db.Column(db.String(20), unique=True, nullable=False)
    barcode = db.Column(db.String(50), unique=True, nullable=False)
    location = db.Column(db.String(100))
    time_logs = db.relationship('TimeLog', backref='task', lazy=True)

class TimeLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    duration = db.Column(db.Interval)
    status = db.Column(db.String(20), nullable=False, default='checked_in')
    lunch_break_start = db.Column(db.DateTime)
    lunch_break_end = db.Column(db.DateTime)
    bathroom_break_start = db.Column(db.DateTime)
    bathroom_break_end = db.Column(db.DateTime)

    def update_duration(self, new_duration):
        if isinstance(new_duration, timedelta):
            self.duration = new_duration
            if self.start_time:
                self.end_time = self.start_time + new_duration
        else:
            raise ValueError("new_duration must be a timedelta object")
