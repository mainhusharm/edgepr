from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
import os

admin_auth_bp = Blueprint('admin_auth_bp', __name__)

ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Str0ngP@ssw0rd!')

@admin_auth_bp.route('/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"msg": "Missing username or password"}), 400

    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        access_token = create_access_token(identity=username, expires_delta=False)
        return jsonify(access_token=access_token), 200
    
    return jsonify({"msg": "Bad username or password"}), 401
