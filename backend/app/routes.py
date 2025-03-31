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
            # Try converting to numeric
            numeric_series = pd.to_numeric(df[col].dropna())
            result[col] = {
                "type": "numeric",
                "min": float(numeric_series.min()),
                "max": float(numeric_series.max())
            }
        except ValueError:
            # Categorical
            unique_vals = df[col].dropna().unique().tolist()
            # Convert all categorical values to strings (safe)
            result[col] = {
                "type": "categorical",
                "values": [str(val) for val in unique_vals]
            }

    return jsonify(result)


@main.route('/api/tasks', methods=['POST'])
def create_task():
    def extract_filters(data_sources):
        filters = []
        for ds in data_sources:
            filters.append({
                "source": ds["selectedSource"],
                "fieldFilters": ds.get("fieldFilters", {})
            })
        return filters

    data = request.get_json()
    print("Received data:", data)

    task_name = data.get("taskName")
    data_sources = data.get("dataSources")

    if not task_name or not data_sources:
        return jsonify({"error": "Missing required fields"}), 400

    task = Task(
        name=task_name,
        data_sources=json.dumps(data_sources),
        filters=json.dumps(extract_filters(data_sources)),  # see helper below
        status="pending"
    )

    db.session.add(task)
    db.session.commit()

    return jsonify({"message": "Task created", "taskId": task.id})


@main.route('/api/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([task.as_dict() for task in tasks])
