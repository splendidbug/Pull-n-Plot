# app/job_queue.py

import time
import threading
import queue
from app import db, socketio
from app.models import Task
from app.filter_database import apply_filters_and_merge
import json

# Create a shared queue
task_queue = queue.Queue()


def worker(app):
    with app.app_context():
        while True:
            task_id = task_queue.get()
            if task_id is None:
                break  # For future: allow graceful shutdown

            print(f"Starting task ID: {task_id}")
            task = Task.query.get(task_id)

            if not task:
                print(f"Task ID {task_id} not found.")
                continue

            # Simulate processing
            time.sleep(10)
            task.status = "Fetching data"
            db.session.commit()
            socketio.emit("task_update", {
                          "taskId": task.id, "status": "Fetching data"})

            time.sleep(10)
            task.status = "Merging data"
            db.session.commit()
            socketio.emit("task_update", {
                          "taskId": task.id, "status": "Merging data"})

            data_sources = json.loads(task.data_sources)
            task_filters = json.loads(task.filters or "[]")
            apply_filters_and_merge(task_id, data_sources, task_filters)

            time.sleep(10)
            task.status = "Completed"
            db.session.commit()
            socketio.emit("task_update", {
                          "taskId": task.id, "status": "Completed"})

            print(f" Finished task ID: {task.id}")
            task_queue.task_done()


# Function to enqueue a task
def enqueue_task(task_id):
    task_queue.put(task_id)


# Start the worker thread once, at startup
def start_worker(app):
    thread = threading.Thread(target=worker, args=(app,), daemon=True)
    thread.start()
