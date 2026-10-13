from functools import wraps

from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.user import User


def admin_required(fn):
    """
    Middleware decorator that allows only authenticated
    users with the ADMIN role to access the protected route.

    Usage:

        @admin_required
        def some_admin_route():
            ...
    """

    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):

        # Get logged-in user's ID from JWT
        user_id = get_jwt_identity()

        # Validate user ID
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({
                "message": "Invalid user identity"
            }), 401

        # Find user
        user = db.session.get(
            User,
            user_id
        )

        if not user:
            return jsonify({
                "message": "User not found"
            }), 404

        # Check role
        if str(user.role).lower() != "admin":
            return jsonify({
                "message": "Admin access required"
            }), 403

        # User is admin → continue to route
        return fn(*args, **kwargs)

    return wrapper