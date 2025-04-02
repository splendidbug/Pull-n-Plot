from app import db
import json
from datetime import datetime, timedelta, timezone


PST = timezone(timedelta(hours=-7))


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    data_sources = db.Column(db.Text, nullable=False)     # JSON string
    filters = db.Column(db.Text)          # JSON string
    status = db.Column(db.String(50), default="pending")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(PST))

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "data_sources": json.loads(self.data_sources),
            "filters": json.loads(self.filters),
            "status": self.status,
            "created_at": self.created_at.isoformat()
        }


"""
id, task_id, source, row_id, column_name, column_value
1,   1,     car1.csv,  1,       make,            bmw
2,   1,     car1.csv,  1,       sales,           2000
3,   1,     car1.csv,  2,       make,            audi
3,   1,     car1.csv,  2,       sales,           3000
"""


class CombinedFilteredData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    row_id = db.Column(db.Integer, nullable=False)
    is_categorical = db.Column(db.Boolean, nullable=False)
    column_name = db.Column(db.String(100), nullable=False)
    column_value = db.Column(db.String(100))
