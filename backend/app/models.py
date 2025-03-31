from datetime import datetime
from app import db


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(50), default="pending")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    filters = db.Column(db.Text)

    records = db.relationship('SalesRecord', backref='task', lazy=True)


class SalesRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    company = db.Column(db.String(100))
    car_model = db.Column(db.String(100))
    date_of_sale = db.Column(db.Date)
    price = db.Column(db.Float)
