from flask import Blueprint, jsonify, current_app, request
import pandas as pd
import os
from app import db
from app.models import Task
import json
import threading
from app.job_queue import enqueue_task
from app.models import CombinedFilteredData
from app.filter_database import filter_records

main = Blueprint('main', __name__)


"""
resp: 
[
  {
    "name": "cars.csv",
    "columns": [
      {"name": "Manufacturer", "type": "categorical"},
      {"name": "year", "type": "numeric"},
      {"name": "price_in_euro", "type": "numeric"}
    ]
  },
  ...
]

"""


@main.route('/api/data-sources', methods=['GET'])
def get_data_sources():
    data_dir = os.path.join(current_app.root_path, '..', 'sample_data')
    sources = []

    for file in os.listdir(data_dir):
        path = os.path.join(data_dir, file)
        _, ext = os.path.splitext(file)
        ext = ext.lower()

        try:
            if ext == ".csv":
                df = pd.read_csv(path)
            elif ext == ".json":
                df = pd.read_json(path)
            else:
                continue  # Skip unsupported files
        except Exception as e:
            continue  # Skip files that can't be read

        columns_with_type = []
        for column in df.columns:
            try:
                sample = df[column].dropna().iloc[:10]
                pd.to_numeric(sample)
                columns_with_type.append({
                    "name": column,
                    "type": "numeric"
                })
            except (ValueError, TypeError):
                columns_with_type.append({
                    "name": column,
                    "type": "categorical"
                })

        sources.append({
            "name": file,
            "columns": columns_with_type
        })

    return jsonify(sources)


@main.route('/api/tasks', methods=['POST'])
def create_task():
    def extract_filters(data_sources):
        filters = []
        for ds in data_sources:
            field_filters = ds.get("fieldFilters", {})

            # Filter out fields with no usable data
            clean_filters = {}
            for field, filter_data in field_filters.items():
                print(field, len(filter_data))
                if not filter_data:
                    continue  # Skip if it's an empty dict

                # Keep only if at least one non-empty value exists
                if any(v for v in filter_data.values()):
                    clean_filters[field] = filter_data

            if clean_filters:
                filters.append({
                    "source": ds["selectedSource"],
                    "fieldFilters": clean_filters
                })
        return filters

    data = request.get_json()

    task_name = data.get("taskName")
    data_sources = data.get("dataSources")

    if not task_name or not data_sources:
        return jsonify({"error": "Missing required fields"}), 400

    task = Task(
        name=task_name,
        data_sources=json.dumps(data_sources),
        filters=json.dumps(extract_filters(data_sources)),
        status="pending"
    )

    db.session.add(task)
    db.session.commit()

    enqueue_task(task.id)

    return jsonify({"message": "Task created", "taskId": task.id})


@main.route('/api/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([task.as_dict() for task in tasks])


@main.route('/api/filtered-records', methods=['GET'])
def get_filtered_records():
    records = CombinedFilteredData.query.all()

    return jsonify([
        {
            "id": record.id,
            "task_id": record.task_id,
            "row_id": record.row_id,
            "is_categorical": record.is_categorical,
            "column_name": record.column_name,
            "column_value": record.column_value
        }
        for record in records
    ])


@main.route('/api/task_fields', methods=['GET'])
def get_task_column_names():
    task_id = request.args.get("task_id", type=int)
    if not task_id:
        return jsonify({"error": "task_id is required"}), 400

    results = (
        db.session.query(
            CombinedFilteredData.column_name,
            CombinedFilteredData.is_categorical
        )
        .filter(CombinedFilteredData.task_id == task_id)
        .distinct(CombinedFilteredData.column_name)
        .all()
    )

    columns = [
        {"name": name, "type": "categorical" if is_cat else "numeric"}
        for name, is_cat in results
    ]
    return jsonify(columns)


@main.route("/api/filtered-values", methods=["POST"])
def get_filtered_values():
    data = request.get_json()
    selected_fields = data.get("fields", [])  # ["col1", "col2"]
    filters = data.get("filters", {})         # {col1: {from/to/values}}

    df = filter_records(selected_fields, filters)

    result = df.dropna().to_dict(orient="records")
    print("in filter route: ", len(result))
    return jsonify(result)


@main.route("/api/tasks/completed", methods=["GET"])
def get_completed_tasks():
    tasks = Task.query.filter_by(status="completed").order_by(
        Task.created_at.desc()).all()
    return jsonify([task.as_dict() for task in tasks])
