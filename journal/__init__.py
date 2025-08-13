from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .models import db
from .routes import trades_bp, risk_plan_bp, plan_generation_bp
from .auth import auth_bp
from .user_routes import user_bp
from .admin_auth import admin_auth_bp
from .telegram_routes import telegram_bp
from .account_routes import account_bp
from .extensions import socketio
import os
from dotenv import load_dotenv

def create_app(config_object='journal.config.DevelopmentConfig'):
    load_dotenv()
    app = Flask(__name__)
    app.config.from_object(config_object)

    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", "*")}})
    socketio.init_app(app, cors_allowed_origins=app.config.get("CORS_ORIGINS", "*"))

    # Register blueprints
    app.register_blueprint(trades_bp, url_prefix='/api')
    app.register_blueprint(risk_plan_bp, url_prefix='')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(admin_auth_bp, url_prefix='/api/admin')
    app.register_blueprint(telegram_bp, url_prefix='/api/telegram')
    app.register_blueprint(plan_generation_bp, url_prefix='/api')
    app.register_blueprint(account_bp, url_prefix='/api/accounts')

    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()

    return app

def create_production_app():
    return create_app('journal.config.ProductionConfig')
