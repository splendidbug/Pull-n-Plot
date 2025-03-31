import time
from app import db, socketio
from app.models import Task


def simulate_task_processing(task_id, app):

    with app.app_context():  # 👈 this gives the thread the context it needs
        print(f"Simulating task processing for task ID: {task_id}")
        task = Task.query.get(task_id)

        if not task:
            print(f"No task found with ID {task_id}")
            return

        # Simulate delay before in-progress
        time.sleep(10)
        task.status = "in progress"
        db.session.commit()
        socketio.emit("task_update", {
                      "taskId": task.id, "status": "in progress"})
        print(f"Emitted in-progress for task {task.id}")
        print("Clients connected:", socketio.server.manager.rooms)

        # Simulate delay before completion
        time.sleep(10)
        task.status = "completed"
        db.session.commit()
        socketio.emit("task_update", {
                      "taskId": task.id, "status": "completed"})
        print(f"Emitted completed for task {task.id}")
