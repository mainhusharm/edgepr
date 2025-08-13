import uuid
from flask import Blueprint, request, jsonify
from .models import db, User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.exceptions import BadRequest

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if data is None:
            raise BadRequest("No JSON data received")
    except BadRequest as e:
        return jsonify({"msg": f"Bad Request: {str(e)}"}), 400
        
    firstName = data.get('firstName')
    lastName = data.get('lastName')
    email = data.get('email')
    password = data.get('password')
    plan_type = data.get('plan_type')

    if not firstName or not lastName or not email or not password or not plan_type:
        return jsonify({"msg": "Missing required fields"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "Email already registered"}), 400

    username = f"{firstName} {lastName}"

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    
    new_user = User(
        username=username,
        email=email,
        password_hash=hashed_password,
        plan_type=plan_type
    )
    
    db.session.add(new_user)
    db.session.commit()

    access_token = create_access_token(identity=new_user.id)
    
    return jsonify(access_token=access_token), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"msg": "Missing email or password"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"msg": "Bad email or password"}), 401

    # Temporary override for specific user
    if user.email == 'anchalw11@gmail.com':
        user.plan_type = 'enterprise'

    session_id = str(uuid.uuid4())
    user.active_session_id = session_id
    db.session.commit()

    access_token = create_access_token(
        identity=user.id,
        additional_claims={'session_id': session_id, 'plan_type': user.plan_type, 'username': user.username}
    )
    return jsonify(access_token=access_token), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    # Temporary override for specific user
    if user.email == 'anchalw11@gmail.com':
        user.plan_type = 'enterprise'

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "plan_type": user.plan_type
    }), 200
