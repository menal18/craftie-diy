

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from services.auth_service import (
    register_user,
    login_user,
    get_user_by_id
)


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


# =========================================================
# REGISTER
# POST /api/auth/register
# =========================================================
@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    phone = data.get("phone")
    password = data.get("password", "")

    # Password length validation
    if len(password) < 6:
        return jsonify({
            "message": "Password must be at least 6 characters"
        }), 400

    user, error = register_user(
        name=name,
        email=email,
        phone=phone,
        password=password
    )

    if error:

        if error == "Email already registered":
            return jsonify({
                "message": error
            }), 409

        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Registration successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role
        }
    }), 201


# =========================================================
# LOGIN
# POST /api/auth/login
# =========================================================
@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "message": "Email and password are required"
        }), 400

    user, access_token, error = login_user(
        email=email,
        password=password
    )

    if error:
        return jsonify({
            "message": error
        }), 401

    return jsonify({
        "message": "Login successful",
        "token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role
        }
    }), 200


# =========================================================
# PROFILE
# GET /api/auth/profile
# =========================================================
@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():

    user_id = get_jwt_identity()

    user = get_user_by_id(int(user_id))

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    return jsonify({
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "created_at": (
                user.created_at.isoformat()
                if user.created_at
                else None
            )
        }
    }), 200