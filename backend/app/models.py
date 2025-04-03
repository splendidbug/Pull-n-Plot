from app import db
import json
from datetime import datetime, timedelta, timezone


PST = timezone(timedelta(hours=-7))


class Task(db.Model):
    """
    Store task information. Store task id, task name, data sources, filters on the data sources, ask status, and time of creation

    """

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    data_sources = db.Column(db.Text, nullable=False)
    filters = db.Column(db.Text)
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


class CombinedFilteredData(db.Model):
    """
    Store merged data frame after filtering

    Sample database:
    id, task_id, row_id, column_name, column_value
    1,   1,       1,       make,            bmw
    2,   1,       1,       sales,           2000
    3,   1,       2,       make,            audi
    3,   1,       2,       sales,           3000
    """

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    row_id = db.Column(db.Integer, nullable=False)
    is_categorical = db.Column(db.Boolean, nullable=False)
    column_name = db.Column(db.String(100), nullable=False)
    column_value = db.Column(db.String(100))
