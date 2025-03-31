from datetime import datetime
from app import db
import json


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    data_sources = db.Column(db.Text, nullable=False)     # JSON string
    filters = db.Column(db.Text, nullable=False)          # JSON string
    status = db.Column(db.String(50), default="pending")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "data_sources": json.loads(self.data_sources),
            "filters": json.loads(self.filters),
            "status": self.status,
            "created_at": self.created_at.isoformat()
        }


class SalesRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    company = db.Column(db.String(100))
    car_model = db.Column(db.String(100))
    date_of_sale = db.Column(db.Date)
    price = db.Column(db.Float)
