
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.user import User
from services.notification_service import (
    create_custom_order_notification,
)

from services.custom_order_service import (
    create_custom_order,
    get_user_custom_orders,
    get_user_custom_order,
    get_custom_order_by_id,
    update_custom_order,
    cancel_custom_order,
    accept_custom_order,
    reject_custom_order,
    get_all_custom_orders,
    admin_get_custom_order,
    admin_update_custom_order,
    admin_reject_custom_order,
    admin_cancel_custom_order,
    set_custom_order_quote,
    update_custom_order_status,
    get_custom_orders_by_status,
    get_custom_order_count
)


custom_order_bp = Blueprint(
    "custom_order",
    __name__,
    url_prefix="/api/custom-orders"
)


# =========================================================
# HELPER
# =========================================================
def custom_order_to_dict(order):
    return {
        "id": order.id,
        "user_id": order.user_id,

        "customer": {
            "id": order.user.id,
            "name": order.user.name,
            "email": order.user.email,
            "phone": order.user.phone,
        } if order.user else None,

        "address_id": order.address_id,
        "delivery_address": (
            {
                "id": order.address.id,
                "full_name": order.address.full_name,
                "phone": order.address.phone,
                "address_line1": order.address.address_line1,
                "address_line2": order.address.address_line2,
                "city": order.address.city,
                "state": order.address.state,
                "postal_code": order.address.postal_code,
                "country": order.address.country,
                "address_type": order.address.address_type,
            }
            if order.address
            else None
        ),

        "product_id": order.product_id,
        "title": order.title,
        "description": order.description,
        "customization_details": order.customization_details,
        "reference_image_url": order.reference_image_url,
        "quantity": order.quantity,
        "estimated_price": (
            float(order.estimated_price)
            if order.estimated_price is not None
            else None
        ),
        "status": order.status,
        "admin_notes": order.admin_notes,
        "created_at": (
            order.created_at.isoformat()
            if order.created_at
            else None
        ),
        "updated_at": (
            order.updated_at.isoformat()
            if order.updated_at
            else None
        )
    }

def get_current_user():
    try:
        user_id = int(get_jwt_identity())
    except (ValueError, TypeError):
        return None

    return db.session.get(User, user_id)


def is_admin(user):
    return user and str(user.role).lower() == "admin"


# =========================================================
# CREATE CUSTOM ORDER
# =========================================================

@custom_order_bp.route("", methods=["POST"])
@jwt_required()
def create_custom_order_route():

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    custom_order, error = create_custom_order(
        user_id=user.id,
        title=data.get("title"),
        description=data.get("description"),
        customization_details=data.get(
            "customization_details"
        ),
        reference_image_url=data.get(
            "reference_image_url"
        ),
        quantity=data.get("quantity", 1),
        product_id=data.get("product_id"),
        address_id=data.get("address_id")
    )

    if error:
        status_code = 404 if error == "Product not found" else 400

        return jsonify({
            "message": error
        }), status_code

    return jsonify({
        "message": "Custom order created successfully",
        "custom_order": custom_order_to_dict(custom_order)
    }), 201


# =========================================================
# GET CUSTOM ORDERS
# =========================================================

@custom_order_bp.route("", methods=["GET"])
@jwt_required()
def get_custom_orders():

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if is_admin(user):
        orders = get_all_custom_orders()
    else:
        orders = get_user_custom_orders(user.id)

    return jsonify({
        "count": len(orders),
        "custom_orders": [
            custom_order_to_dict(order)
            for order in orders
        ]
    }), 200


# =========================================================
# GET SINGLE CUSTOM ORDER
# =========================================================

@custom_order_bp.route("/<int:order_id>", methods=["GET"])
@jwt_required()
def get_custom_order(order_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if is_admin(user):
        custom_order, error = admin_get_custom_order(order_id)

        if error:
            return jsonify({
                "message": error
            }), 404
    else:
        custom_order = get_user_custom_order(
            user.id,
            order_id
        )

        if not custom_order:
            return jsonify({
                "message": "Custom order not found"
            }), 404

    return jsonify({
        "custom_order": custom_order_to_dict(custom_order)
    }), 200


# =========================================================
# UPDATE CUSTOMER CUSTOM ORDER
# =========================================================

@custom_order_bp.route("/<int:order_id>", methods=["PUT"])
@jwt_required()
def update_custom_order_route(order_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if is_admin(user):
        return jsonify({
            "message": "Use the admin update endpoint"
        }), 403

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    custom_order, error = update_custom_order(
        user_id=user.id,
        custom_order_id=order_id,
        title=data.get("title")
        if "title" in data else None,
        description=data.get("description")
        if "description" in data else None,
        customization_details=data.get(
            "customization_details"
        )
        if "customization_details" in data else None,
        reference_image_url=data.get(
            "reference_image_url"
        )
        if "reference_image_url" in data else None,
        quantity=data.get("quantity")
        if "quantity" in data else None
    )

    if error:
        status_code = (
            404
            if error == "Custom order not found"
            else 400
        )

        return jsonify({
            "message": error
        }), status_code

    return jsonify({
        "message": "Custom order updated successfully",
        "custom_order": custom_order_to_dict(custom_order)
    }), 200


# =========================================================
# CANCEL CUSTOMER CUSTOM ORDER
# =========================================================

@custom_order_bp.route("/<int:order_id>", methods=["DELETE"])
@jwt_required()
def cancel_custom_order_route(order_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if is_admin(user):
        return jsonify({
            "message": "Use the admin cancel endpoint"
        }), 403

    custom_order, error = cancel_custom_order(
        user.id,
        order_id
    )

    if error:
        status_code = (
            404
            if error == "Custom order not found"
            else 400
        )

        return jsonify({
            "message": error
        }), status_code

    return jsonify({
        "message": "Custom order cancelled successfully",
        "custom_order": custom_order_to_dict(custom_order)
    }), 200


# =========================================================
# ACCEPT QUOTATION
# =========================================================

@custom_order_bp.route("/<int:order_id>/accept", methods=["PUT"])
@jwt_required()
def accept_custom_order_route(order_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if is_admin(user):
        return jsonify({
            "message": "Only customers can accept their quotation"
        }), 403

    custom_order, error = accept_custom_order(
        user.id,
        order_id
    )

    if error:
        status_code = (
            404
            if error == "Custom order not found"
            else 400
        )

        return jsonify({
            "message": error
        }), status_code

    notification, notification_error = create_custom_order_notification(
        user_id=custom_order.user_id,
        custom_order_id=custom_order.id,
        title="Custom Order Quote Accepted",
        message=f'You accepted the quotation for "{custom_order.title}".',
        idempotency_key=f"co-{custom_order.id}-accepted",
    )
    if notification_error:
        current_app.logger.error(
            "Could not create acceptance notification for custom order %s: %s",
            custom_order.id,
            notification_error,
        )

    return jsonify({
        "message": "Custom order quotation accepted successfully",
        "custom_order": custom_order_to_dict(custom_order),
        "notification_created": notification is not None,
    }), 200


# =========================================================
# CUSTOMER REJECT QUOTATION
# =========================================================

@custom_order_bp.route(
    "/<int:order_id>/reject",
    methods=["PUT"]
)
@jwt_required()
def reject_custom_order_route(order_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if is_admin(user):
        return jsonify({
            "message": "Only customers can reject their quotation"
        }), 403

    custom_order, error = reject_custom_order(
        user.id,
        order_id
    )

    if error:
        status_code = (
            404 if error == "Custom order not found"
            else 400
        )

        return jsonify({
            "message": error
        }), status_code

    notification, notification_error = create_custom_order_notification(
        user_id=custom_order.user_id,
        custom_order_id=custom_order.id,
        title="Custom Order Quote Rejected",
        message=f'You rejected the quotation for "{custom_order.title}".',
        idempotency_key=f"co-{custom_order.id}-rejected",
    )
    if notification_error:
        current_app.logger.error(
            "Could not create rejection notification for custom order %s: %s",
            custom_order.id,
            notification_error,
        )

    return jsonify({
        "message": "Custom order quotation rejected successfully",
        "custom_order": custom_order_to_dict(custom_order),
        "notification_created": notification is not None,
    }), 200


# =========================================================
# ADMIN UPDATE CUSTOM ORDER
# =========================================================

@custom_order_bp.route("/<int:order_id>/admin", methods=["PUT"])
@jwt_required()
def admin_update_custom_order_route(order_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if not is_admin(user):
        return jsonify({
            "message": "Admin access required"
        }), 403

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    previous_order = get_custom_order_by_id(order_id)
    previous_status = previous_order.status if previous_order else None

    custom_order, error = admin_update_custom_order(
        custom_order_id=order_id,
        status=data.get("status")
        if "status" in data else None,
        estimated_price=data.get("estimated_price")
        if "estimated_price" in data else None,
        admin_notes=data.get("admin_notes")
        if "admin_notes" in data else None
    )

    if error:
        status_code = (
            404
            if error == "Custom order not found"
            else 400
        )

        return jsonify({
            "message": error
        }), status_code

    notification = None
    notification_error = None
    if previous_status != custom_order.status:
        notification, notification_error = create_custom_order_notification(
            user_id=custom_order.user_id,
            custom_order_id=custom_order.id,
            title="Custom Order Status Updated",
            message=(
                f'Your custom order "{custom_order.title}" is now '
                f"{custom_order.status.replace('_', ' ')}."
            ),
            idempotency_key=(
                f"co-{custom_order.id}-status-{custom_order.status}"
            ),
        )

    if notification_error:
        current_app.logger.error(
            "Could not create admin update notification for custom order %s: %s",
            custom_order.id,
            notification_error,
        )

    return jsonify({
        "message": "Custom order updated by admin successfully",
        "custom_order": custom_order_to_dict(custom_order),
        "notification_created": notification is not None,
    }), 200


# =========================================================
# ADMIN REJECT
# =========================================================

@custom_order_bp.route(
    "/<int:order_id>/admin/reject",
    methods=["PUT"]
)
@jwt_required()
def admin_reject_custom_order_route(order_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if not is_admin(user):
        return jsonify({
            "message": "Admin access required"
        }), 403

    data = request.get_json() or {}
    previous_order = get_custom_order_by_id(order_id)
    previous_status = previous_order.status if previous_order else None

    custom_order, error = admin_reject_custom_order(
        custom_order_id=order_id,
        admin_notes=data.get("admin_notes")
    )

    if error:
        status_code = (
            404
            if error == "Custom order not found"
            else 400
        )

        return jsonify({
            "message": error
        }), status_code

    notification = None
    notification_error = None
    if previous_status != custom_order.status:
        notification, notification_error = create_custom_order_notification(
            user_id=custom_order.user_id,
            custom_order_id=custom_order.id,
            title="Custom Order Rejected",
            message=(
                f'Your custom order "{custom_order.title}" is now rejected.'
            ),
            idempotency_key=f"co-{custom_order.id}-status-rejected",
        )

    if notification_error:
        current_app.logger.error(
            "Could not create rejection notification for custom order %s: %s",
            custom_order.id,
            notification_error,
        )

    return jsonify({
        "message": "Custom order rejected successfully",
        "custom_order": custom_order_to_dict(custom_order),
        "notification_created": notification is not None,
    }), 200


# =========================================================
# ADMIN CANCEL
# =========================================================

@custom_order_bp.route(
    "/<int:order_id>/admin/cancel",
    methods=["PUT"]
)
@jwt_required()
def admin_cancel_custom_order_route(order_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if not is_admin(user):
        return jsonify({
            "message": "Admin access required"
        }), 403

    data = request.get_json() or {}
    previous_order = get_custom_order_by_id(order_id)
    previous_status = previous_order.status if previous_order else None

    custom_order, error = admin_cancel_custom_order(
        custom_order_id=order_id,
        admin_notes=data.get("admin_notes")
    )

    if error:
        status_code = (
            404
            if error == "Custom order not found"
            else 400
        )

        return jsonify({
            "message": error
        }), status_code

    notification = None
    notification_error = None
    if previous_status != custom_order.status:
        notification, notification_error = create_custom_order_notification(
            user_id=custom_order.user_id,
            custom_order_id=custom_order.id,
            title="Custom Order Cancelled",
            message=(
                f'Your custom order "{custom_order.title}" is now cancelled.'
            ),
            idempotency_key=f"co-{custom_order.id}-status-cancelled",
        )

    if notification_error:
        current_app.logger.error(
            "Could not create cancellation notification for custom order %s: %s",
            custom_order.id,
            notification_error,
        )

    return jsonify({
        "message": "Custom order cancelled by admin",
        "custom_order": custom_order_to_dict(custom_order),
        "notification_created": notification is not None,
    }), 200


# =========================================================
# ADMIN SET QUOTE
# =========================================================


# =========================================================
# ADMIN SET QUOTE + NOTIFY CUSTOMER
# =========================================================

@custom_order_bp.route(
    "/<int:order_id>/quote",
    methods=["PUT"]
)
@jwt_required()
def set_custom_order_quote_route(order_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if not is_admin(user):
        return jsonify({
            "message": "Admin access required"
        }), 403

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Request body is required"
        }), 400

    estimated_price = data.get("estimated_price")

    if estimated_price is None:
        return jsonify({
            "message": "estimated_price is required"
        }), 400

    previous_order = get_custom_order_by_id(order_id)
    previous_status = previous_order.status if previous_order else None
    previous_price = previous_order.estimated_price if previous_order else None

    # Save quotation price
    custom_order, error = set_custom_order_quote(
        custom_order_id=order_id,
        estimated_price=estimated_price,
        admin_notes=data.get("admin_notes")
    )

    if error:
        status_code = (
            404
            if error == "Custom order not found"
            else 400
        )

        return jsonify({
            "message": error
        }), status_code

    notification = None
    notification_error = None

    quote_changed = (
        previous_status != "quoted"
        or previous_price != custom_order.estimated_price
    )
    if quote_changed:
        notification, notification_error = create_custom_order_notification(
            user_id=custom_order.user_id,
            custom_order_id=custom_order.id,
            title="Custom Order Quotation Ready",
            message=(
                f'The quotation for "{custom_order.title}" '
                f'is ₹{float(custom_order.estimated_price):.2f}. '
                "Please review the price in your custom orders "
                "and accept or reject the request."
            ),
            idempotency_key=(
                f"co-{custom_order.id}-quote-{previous_status or 'new'}-"
                f"{custom_order.estimated_price}"
            ),
        )

    if notification_error:
        current_app.logger.error(
            "Could not create quotation notification for custom order %s: %s",
            custom_order.id,
            notification_error,
        )

    return jsonify({
        "message": (
            "Quotation saved and customer notified"
            if notification and not notification_error
            else "Quotation saved successfully"
            if not quote_changed
            else "Quotation saved, but notification could not be confirmed"
        ),
        "custom_order": custom_order_to_dict(custom_order),
        "notification_created": bool(
            notification and not notification_error
        ),
        "notification_error": notification_error
    }), 200



# =========================================================
# ADMIN STATUS
# =========================================================

@custom_order_bp.route(
    "/<int:order_id>/status",
    methods=["PUT"]
)
@jwt_required()
def update_custom_order_status_route(order_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if not is_admin(user):
        return jsonify({
            "message": "Admin access required"
        }), 403

    data = request.get_json()

    if not data or not data.get("status"):
        return jsonify({
            "message": "status is required"
        }), 400

    previous_order = get_custom_order_by_id(order_id)
    previous_status = previous_order.status if previous_order else None

    custom_order, error = update_custom_order_status(
        custom_order_id=order_id,
        status=data.get("status")
    )

    if error:
        status_code = (
            404
            if error == "Custom order not found"
            else 400
        )

        return jsonify({
            "message": error
        }), status_code

    notification = None
    notification_error = None
    if previous_status != custom_order.status:
        notification, notification_error = create_custom_order_notification(
            user_id=custom_order.user_id,
            custom_order_id=custom_order.id,
            title="Custom Order Status Updated",
            message=(
                f'Your custom order "{custom_order.title}" is now '
                f"{custom_order.status.replace('_', ' ')}."
            ),
            idempotency_key=(
                f"co-{custom_order.id}-status-{custom_order.status}"
            ),
        )

    if notification_error:
        current_app.logger.error(
            "Could not create status notification for custom order %s: %s",
            custom_order.id,
            notification_error,
        )

    return jsonify({
        "message": "Custom order status updated successfully",
        "custom_order": custom_order_to_dict(custom_order),
        "notification_created": notification is not None,
    }), 200


# =========================================================
# ADMIN FILTER BY STATUS
# =========================================================

@custom_order_bp.route(
    "/admin/status/<string:status>",
    methods=["GET"]
)
@jwt_required()
def get_custom_orders_by_status_route(status):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if not is_admin(user):
        return jsonify({
            "message": "Admin access required"
        }), 403

    orders = get_custom_orders_by_status(status)

    return jsonify({
        "count": len(orders),
        "custom_orders": [
            custom_order_to_dict(order)
            for order in orders
        ]
    }), 200


# =========================================================
# ADMIN COUNT
# =========================================================

@custom_order_bp.route(
    "/admin/count",
    methods=["GET"]
)
@jwt_required()
def get_custom_order_count_route():

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if not is_admin(user):
        return jsonify({
            "message": "Admin access required"
        }), 403

    status = request.args.get("status")

    count = get_custom_order_count(status)

    return jsonify({
        "count": count,
        "status": status
    }), 200