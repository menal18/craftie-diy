
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from uuid import uuid4

from extensions import db
from models.user import User
from services.email_service import send_notification_email
from services.notification_service import (
    create_notification,
    get_user_notifications,
    get_notification_by_id,
    mark_notification_as_read,
    mark_all_notifications_as_read,
    delete_notification,
    delete_all_notifications,
    get_unread_notification_count,
    get_notification_count,
    create_notification_for_all_users,
)


notification_bp = Blueprint(
    "notification",
    __name__,
    url_prefix="/api/notifications"
)


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def get_current_user():
    user_id = get_jwt_identity()

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        return None

    return db.session.get(User, user_id)


def is_admin(user):
    return bool(user and str(user.role).lower() == "admin")


def notification_to_dict(notification):
    return {
        "id": notification.id,
        "user_id": notification.user_id,
        "title": notification.title,
        "message": notification.message,
        "notification_type": notification.notification_type,
        "reference_id": notification.reference_id,
        "is_read": bool(notification.is_read),
        "created_at": (
            notification.created_at.isoformat()
            if notification.created_at
            else None
        ),
    }


def get_idempotency_key():
    key = request.headers.get("Idempotency-Key", "").strip()

    if not key:
        return str(uuid4()), None

    if len(key) > 80:
        return None, "Idempotency-Key must be 80 characters or fewer"

    return key, None


def deliver_notification_email(notification, recipient):
    if notification.email_status == "sent":
        return {
            "status": "sent",
            "error": None,
            "already_sent": True,
        }

    if not recipient:
        notification.email_status = "failed"
        notification.email_error = "Recipient email not found"
        db.session.commit()

        return {
            "status": "failed",
            "error": "Recipient email not found",
            "already_sent": False,
        }

    try:
        delivered, error = send_notification_email(
            recipient=recipient,
            title=notification.title,
            message=notification.message,
            notification_id=notification.id,
        )

        notification.email_status = "sent" if delivered else "failed"
        notification.email_error = error
        db.session.commit()

        return {
            "status": notification.email_status,
            "error": error,
            "already_sent": False,
        }

    except Exception as exc:
        db.session.rollback()
        return {
            "status": "failed",
            "error": str(exc),
            "already_sent": False,
        }


def validate_notification_type(value):
    allowed_types = [
        "general",
        "order",
        "payment",
        "custom_order",
        "promotion",
        "promo_code",
        "system",
    ]

    notification_type = str(value or "general").lower().strip()

    if notification_type not in allowed_types:
        return None, allowed_types

    return notification_type, None


def parse_reference_id(value):
    if value is None:
        return None, None

    try:
        return int(value), None
    except (ValueError, TypeError):
        return None, "reference_id must be a number"


# =========================================================
# 1. ADMIN CREATE NOTIFICATION FOR ONE USER
# POST /api/notifications
# =========================================================

@notification_bp.route("", methods=["POST"])
@jwt_required()
def create_notification_route():
    user = get_current_user()

    if not user:
        return jsonify({"message": "User not found"}), 404

    if not is_admin(user):
        return jsonify({"message": "Admin access required"}), 403

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"message": "Request body is required"}), 400

    idempotency_key, key_error = get_idempotency_key()

    if key_error:
        return jsonify({"message": key_error}), 400

    user_id = data.get("user_id")
    title = data.get("title")
    message = data.get("message")

    if user_id is None:
        return jsonify({"message": "user_id is required"}), 400

    if not isinstance(title, str) or not title.strip():
        return jsonify({"message": "title is required"}), 400

    if not isinstance(message, str) or not message.strip():
        return jsonify({"message": "message is required"}), 400

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user_id"}), 400

    notification_type, type_error = validate_notification_type(
        data.get("notification_type", "general")
    )

    if type_error:
        return jsonify({
            "message": "Invalid notification_type",
            "allowed_types": type_error,
        }), 400

    reference_id, reference_error = parse_reference_id(
        data.get("reference_id")
    )

    if reference_error:
        return jsonify({"message": reference_error}), 400

    notification, error = create_notification(
        user_id=user_id,
        title=title.strip(),
        message=message.strip(),
        notification_type=notification_type,
        reference_id=reference_id,
        idempotency_key=idempotency_key,
    )

    if error:
        if error == "User not found":
            return jsonify({"message": error}), 404

        if str(error).startswith("Idempotency key"):
            return jsonify({"message": error}), 409

        return jsonify({"message": error}), 400

    target_user = db.session.get(User, user_id)

    email_result = deliver_notification_email(
        notification,
        target_user.email if target_user else None,
    )

    return jsonify({
        "message": (
            "Notification created and email accepted by the mail server"
            if email_result["status"] == "sent"
            else "Notification saved in-app, but email delivery failed"
        ),
        "notification": notification_to_dict(notification),
        "email_delivery": email_result,
    }), 201


# =========================================================
# 2. GET MY NOTIFICATIONS
# GET /api/notifications
# =========================================================

@notification_bp.route("", methods=["GET"])
@jwt_required()
def get_notifications():
    user = get_current_user()

    if not user:
        return jsonify({"message": "User not found"}), 404

    unread = request.args.get("unread")
    unread_only = False

    if unread is not None:
        unread_value = unread.lower().strip()

        if unread_value == "true":
            unread_only = True
        elif unread_value == "false":
            unread_only = False
        else:
            return jsonify({
                "message": "unread must be true or false"
            }), 400

    notifications = get_user_notifications(
        user.id,
        unread_only=unread_only,
    )

    return jsonify({
        "count": len(notifications),
        "unread_count": get_unread_notification_count(user.id),
        "notifications": [
            notification_to_dict(item)
            for item in notifications
        ],
    }), 200


# =========================================================
# 3. GET ONE NOTIFICATION
# GET /api/notifications/<notification_id>
# =========================================================

@notification_bp.route("/<int:notification_id>", methods=["GET"])
@jwt_required()
def get_notification(notification_id):
    user = get_current_user()

    if not user:
        return jsonify({"message": "User not found"}), 404

    notification = get_notification_by_id(
        user.id,
        notification_id,
    )

    if not notification:
        return jsonify({"message": "Notification not found"}), 404

    return jsonify({
        "notification": notification_to_dict(notification)
    }), 200


# =========================================================
# 4. MARK ONE NOTIFICATION AS READ
# PUT /api/notifications/<notification_id>/read
# =========================================================

@notification_bp.route(
    "/<int:notification_id>/read",
    methods=["PUT"],
)
@jwt_required()
def mark_notification_read(notification_id):
    user = get_current_user()

    if not user:
        return jsonify({"message": "User not found"}), 404

    notification, error = mark_notification_as_read(
        user.id,
        notification_id,
    )

    if error:
        return jsonify({"message": error}), 404

    return jsonify({
        "message": "Notification marked as read",
        "notification": notification_to_dict(notification),
    }), 200


# =========================================================
# 5. MARK ALL NOTIFICATIONS AS READ
# PUT /api/notifications/read-all
# =========================================================

@notification_bp.route("/read-all", methods=["PUT"])
@jwt_required()
def mark_all_notifications_read():
    user = get_current_user()

    if not user:
        return jsonify({"message": "User not found"}), 404

    unread_count = get_unread_notification_count(user.id)

    success, error = mark_all_notifications_as_read(user.id)

    if error:
        status_code = (
            409
            if str(error).startswith("Idempotency key")
            or "already being processed" in str(error)
            else 500
        )
        return jsonify({"message": error}), status_code

    return jsonify({
        "message": "All notifications marked as read",
        "updated_count": unread_count,
    }), 200


# =========================================================
# 6. DELETE ONE NOTIFICATION
# DELETE /api/notifications/<notification_id>
# =========================================================

@notification_bp.route(
    "/<int:notification_id>",
    methods=["DELETE"],
)
@jwt_required()
def delete_notification_route(notification_id):
    user = get_current_user()

    if not user:
        return jsonify({"message": "User not found"}), 404

    success, error = delete_notification(
        user.id,
        notification_id,
    )

    if error:
        return jsonify({"message": error}), 404

    return jsonify({
        "message": "Notification deleted successfully"
    }), 200


# =========================================================
# 7. DELETE ALL MY NOTIFICATIONS
# DELETE /api/notifications/all
# =========================================================

@notification_bp.route("/all", methods=["DELETE"])
@jwt_required()
def delete_all_my_notifications():
    user = get_current_user()

    if not user:
        return jsonify({"message": "User not found"}), 404

    success, error = delete_all_notifications(user.id)

    if error:
        return jsonify({"message": error}), 500

    return jsonify({
        "message": "All notifications deleted successfully"
    }), 200


# =========================================================
# 8. GET NOTIFICATION COUNTS
# GET /api/notifications/count
# =========================================================

@notification_bp.route("/count", methods=["GET"])
@jwt_required()
def notification_count():
    user = get_current_user()

    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify({
        "total_count": get_notification_count(user.id),
        "unread_count": get_unread_notification_count(user.id),
    }), 200


# =========================================================
# 9. ADMIN SEND NOTIFICATION TO ALL USERS
# POST /api/notifications/admin/broadcast
# =========================================================

@notification_bp.route("/admin/broadcast", methods=["POST"])
@jwt_required()
def broadcast_notification():
    user = get_current_user()

    if not user:
        return jsonify({"message": "User not found"}), 404

    if not is_admin(user):
        return jsonify({"message": "Admin access required"}), 403

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"message": "Request body is required"}), 400

    idempotency_key, key_error = get_idempotency_key()

    if key_error:
        return jsonify({"message": key_error}), 400

    title = data.get("title")
    message = data.get("message")

    if not isinstance(title, str) or not title.strip():
        return jsonify({"message": "title is required"}), 400

    if not isinstance(message, str) or not message.strip():
        return jsonify({"message": "message is required"}), 400

    notification_type, type_error = validate_notification_type(
        data.get("notification_type", "general")
    )

    if type_error:
        return jsonify({
            "message": "Invalid notification_type",
            "allowed_types": type_error,
        }), 400

    reference_id, reference_error = parse_reference_id(
        data.get("reference_id")
    )

    if reference_error:
        return jsonify({"message": reference_error}), 400

    notifications, error = create_notification_for_all_users(
        title=title.strip(),
        message=message.strip(),
        notification_type=notification_type,
        reference_id=reference_id,
        idempotency_key=idempotency_key,
    )

    if error:
        return jsonify({"message": error}), 500

    email_delivery = {
        "sent": 0,
        "failed": 0,
        "already_sent": 0,
        "count": len(notifications),
    }

    for notification in notifications:
        recipient = (
            notification.user.email
            if notification.user
            else None
        )

        delivery = deliver_notification_email(
            notification,
            recipient,
        )

        if delivery["status"] == "sent":
            email_delivery["sent"] += 1
        else:
            email_delivery["failed"] += 1

        if delivery.get("already_sent"):
            email_delivery["already_sent"] += 1

    if not notifications:
        message_text = "There are no customer accounts to notify"
    elif email_delivery["failed"] == 0:
        message_text = (
            "In-app notifications saved and emails accepted "
            "by the mail server for all customers"
        )
    else:
        message_text = (
            "In-app notifications saved; some emails could not be delivered"
        )

    return jsonify({
        "message": message_text,
        "count": len(notifications),
        "email_delivery": email_delivery,
    }), 201
