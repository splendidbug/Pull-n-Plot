from flask import Blueprint, jsonify, current_app, request
import pandas as pd
import os
from app import db
from app.models import Task
import json

main = Blueprint('main', __name__)


@main.route('/api/hello')
def hello():
    return jsonify({"message": "Hello from Flask backend!"})


@main.route('/api/data-sources', methods=['GET'])
def get_data_sources():
    data_dir = os.path.join(current_app.root_path, '..', 'sample_data')
    sources = []

    for file in os.listdir(data_dir):
        if file.endswith('.csv'):
            path = os.path.join(data_dir, file)
            df = pd.read_csv(path, nrows=1)  # Only read header
            sources.append({
                "name": file,
                "columns": list(df.columns)
            })

    return jsonify(sources)


@main.route("/api/data-source-fields", methods=["GET"])
def get_field_details():
    source = request.args.get("source")
    if not source:
        return jsonify({"error": "No data source specified"}), 400

    file_path = os.path.join(current_app.root_path,
                             "..", "sample_data", source)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    df = pd.read_csv(file_path)

    result = {}
    for col in df.columns:
        try:
            # Convert only the first 10 non-null values to numeric
            sample = df[col].iloc[:10].dropna()
            pd.to_numeric(sample)
            result[col] = {
                "type": "numeric"
            }
        except ValueError:
            # Categorical
            result[col] = {
                "type": "categorical"
            }

    return jsonify(result)


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

    print("task: ", task.filters)
    db.session.add(task)
    db.session.commit()

    return jsonify({"message": "Task created", "taskId": task.id})


@main.route('/api/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([task.as_dict() for task in tasks])
