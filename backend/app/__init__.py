from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    with app.app_context():
        from app.models import Task, SalesRecord
        db.drop_all()    # This removes all tables (use only in development!)
        db.create_all()  # This recreates the tables with the updated schema

    from app.routes import main
    app.register_blueprint(main)

    with app.app_context():
        from app.models import Task, SalesRecord
        db.create_all()

    return app
