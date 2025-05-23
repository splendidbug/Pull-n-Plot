from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_socketio import SocketIO

db = SQLAlchemy()
socketio = SocketIO(cors_allowed_origins="*")


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    socketio.init_app(app)

    with app.app_context():
        from app.models import Task
        db.drop_all()    # This removes all tables (use only in development!)
        db.create_all()  # This recreates the tables with the updated schema

    from app.routes import main
    app.register_blueprint(main)

    with app.app_context():
        from app.models import Task
        db.create_all()

    from app.job_queue import start_worker
    start_worker(app)
    return app
