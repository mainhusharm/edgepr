import os

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'a_super_secret_key')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'another_super_secret_key')

class DevelopmentConfig(Config):
    """Development configuration."""
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL', f"sqlite:///{os.path.join(os.path.abspath(os.path.dirname(__name__)), 'instance', 'dev.db')}")
    DEBUG = True
    CORS_ORIGINS = ["http://localhost:5175", "http://127.0.0.1:5175"]

class ProductionConfig(Config):
    """Production configuration."""
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://user:password@host/db')
    DEBUG = False
