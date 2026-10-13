from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from middleware.admin_required import admin_required

from services.contact_message_service import (
    create_contact_message,
    get_all_contact_messages,
    get_contact_message_by_id,
    update_contact_message_status,
    delete_contact_message
)


contact_message_bp = Blueprint(
    "contact_message",
    __name__,
    url_prefix="/api/contact-messages"
)


def contact_message_to_dict(contact_message):
    return {
        "id": contact_message.id,
        "name": contact_message.name,
        "email": contact_message.email,
        "phone": contact_message.phone,
        "message": contact_message.message,
        "status": contact_message.status,
        "created_at": (
            contact_message.created_at.isoformat()
            if contact_message.created_at
            else None
        )
    }


# ==========================================
# CUSTOMER - SEND CONTACT MESSAGE
# ==========================================

@contact_message_bp.route("", methods=["POST"])
def create_message():
    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    message = data.get("message")

    contact_message, error = create_contact_message(
        name=name,
        email=email,
        phone=phone,
        message=message
    )

    if error:
        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Your message has been sent successfully",
        "contact_message": contact_message_to_dict(contact_message)
    }), 201


# ==========================================
# ADMIN - GET ALL CONTACT MESSAGES
# ==========================================

@contact_message_bp.route("", methods=["GET"])
@admin_required
def get_messages():

    messages = get_all_contact_messages()

    return jsonify({
        "messages": [
            contact_message_to_dict(message)
            for message in messages
        ]
    }), 200


# ==========================================
# ADMIN - GET SINGLE MESSAGE
# ==========================================

@contact_message_bp.route("/<int:message_id>", methods=["GET"])
@admin_required
def get_message(message_id):

    contact_message = get_contact_message_by_id(message_id)

    if not contact_message:
        return jsonify({
            "message": "Contact message not found"
        }), 404

    return jsonify({
        "contact_message": contact_message_to_dict(contact_message)
    }), 200


# ==========================================
# ADMIN - UPDATE MESSAGE STATUS
# ==========================================

@contact_message_bp.route(
    "/<int:message_id>/status",
    methods=["PUT"]
)
@admin_required
def update_message_status(message_id):

    contact_message = get_contact_message_by_id(message_id)

    if not contact_message:
        return jsonify({
            "message": "Contact message not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    status = data.get("status")

    if not status:
        return jsonify({
            "message": "Status is required"
        }), 400

    status = str(status).strip().lower()

    contact_message, error = update_contact_message_status(
        contact_message,
        status
    )

    if error:
        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Contact message status updated successfully",
        "contact_message": contact_message_to_dict(
            contact_message
        )
    }), 200


# ==========================================
# ADMIN - DELETE MESSAGE
# ==========================================

@contact_message_bp.route(
    "/<int:message_id>",
    methods=["DELETE"]
)
@admin_required
def delete_message(message_id):

    contact_message = get_contact_message_by_id(message_id)

    if not contact_message:
        return jsonify({
            "message": "Contact message not found"
        }), 404

    delete_contact_message(contact_message)

    return jsonify({
        "message": "Contact message deleted successfully"
    }), 200