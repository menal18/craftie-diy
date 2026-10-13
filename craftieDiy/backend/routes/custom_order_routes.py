# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from datetime import datetime
# from decimal import Decimal, InvalidOperation

# from extensions import db
# from models.custom_order import CustomOrder
# from models.product import Product
# from models.user import User


# custom_order_bp = Blueprint(
#     "custom_order",
#     __name__,
#     url_prefix="/api/custom-orders"
# )


# # =========================================================
# # HELPER FUNCTIONS
# # =========================================================

# def get_current_user():
#     """Get the currently logged-in user."""
#     user_id = get_jwt_identity()

#     try:
#         user_id = int(user_id)
#     except (ValueError, TypeError):
#         return None

#     return db.session.get(User, user_id)


# def is_admin(user):
#     """Check whether the current user is an admin."""
#     if not user:
#         return False

#     return str(user.role).lower() == "admin"


# def custom_order_to_dict(order):
#     """Convert CustomOrder object to JSON-friendly dictionary."""

#     return {
#         "id": order.id,
#         "user_id": order.user_id,
#         "product_id": order.product_id,
#         "title": order.title,
#         "description": order.description,
#         "customization_details": order.customization_details,
#         "reference_image_url": order.reference_image_url,
#         "quantity": order.quantity,
#         "estimated_price": (
#             float(order.estimated_price)
#             if order.estimated_price is not None
#             else None
#         ),
#         "status": order.status,
#         "admin_notes": order.admin_notes,
#         "created_at": (
#             order.created_at.isoformat()
#             if order.created_at
#             else None
#         ),
#         "updated_at": (
#             order.updated_at.isoformat()
#             if order.updated_at
#             else None
#         )
#     }


# # =========================================================
# # 1. CREATE CUSTOM ORDER
# # =========================================================

# @custom_order_bp.route("", methods=["POST"])
# @jwt_required()
# def create_custom_order():

#     user = get_current_user()

#     if not user:
#         return jsonify({
#             "message": "User not found"
#         }), 404

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     # Required fields
#     title = data.get("title")
#     description = data.get("description")

#     if not title:
#         return jsonify({
#             "message": "Title is required"
#         }), 400

#     if not description:
#         return jsonify({
#             "message": "Description is required"
#         }), 400

#     # Quantity
#     quantity = data.get("quantity", 1)

#     try:
#         quantity = int(quantity)
#     except (ValueError, TypeError):
#         return jsonify({
#             "message": "Quantity must be a valid number"
#         }), 400

#     if quantity <= 0:
#         return jsonify({
#             "message": "Quantity must be greater than 0"
#         }), 400

#     # Optional product
#     product_id = data.get("product_id")

#     if product_id is not None:
#         try:
#             product_id = int(product_id)
#         except (ValueError, TypeError):
#             return jsonify({
#                 "message": "Invalid product_id"
#             }), 400

#         product = db.session.get(Product, product_id)

#         if not product:
#             return jsonify({
#                 "message": "Product not found"
#             }), 404

#         if not product.is_active:
#             return jsonify({
#                 "message": "Selected product is not active"
#             }), 400

#     # Create custom order
#     custom_order = CustomOrder(
#         user_id=user.id,
#         product_id=product_id,
#         title=title.strip(),
#         description=description.strip(),
#         customization_details=data.get("customization_details"),
#         reference_image_url=data.get("reference_image_url"),
#         quantity=quantity,
#         estimated_price=None,
#         status="pending",
#         admin_notes=None
#     )

#     db.session.add(custom_order)
#     db.session.commit()

#     return jsonify({
#         "message": "Custom order created successfully",
#         "custom_order": custom_order_to_dict(custom_order)
#     }), 201


# # =========================================================
# # 2. GET MY CUSTOM ORDERS
# # =========================================================

# @custom_order_bp.route("", methods=["GET"])
# @jwt_required()
# def get_custom_orders():

#     user = get_current_user()

#     if not user:
#         return jsonify({
#             "message": "User not found"
#         }), 404

#     # Admin can see all custom orders
#     if is_admin(user):
#         orders = CustomOrder.query.order_by(
#             CustomOrder.created_at.desc()
#         ).all()
#     else:
#         # Customer sees only their own orders
#         orders = CustomOrder.query.filter_by(
#             user_id=user.id
#         ).order_by(
#             CustomOrder.created_at.desc()
#         ).all()

#     return jsonify({
#         "count": len(orders),
#         "custom_orders": [
#             custom_order_to_dict(order)
#             for order in orders
#         ]
#     }), 200


# # =========================================================
# # 3. GET SINGLE CUSTOM ORDER
# # =========================================================

# @custom_order_bp.route("/<int:order_id>", methods=["GET"])
# @jwt_required()
# def get_custom_order(order_id):

#     user = get_current_user()

#     if not user:
#         return jsonify({
#             "message": "User not found"
#         }), 404

#     custom_order = db.session.get(CustomOrder, order_id)

#     if not custom_order:
#         return jsonify({
#             "message": "Custom order not found"
#         }), 404

#     # Customer can only see own order
#     if not is_admin(user) and custom_order.user_id != user.id:
#         return jsonify({
#             "message": "You are not authorized to view this custom order"
#         }), 403

#     return jsonify({
#         "custom_order": custom_order_to_dict(custom_order)
#     }), 200


# # =========================================================
# # 4. UPDATE MY CUSTOM ORDER
# # =========================================================

# @custom_order_bp.route("/<int:order_id>", methods=["PUT"])
# @jwt_required()
# def update_custom_order(order_id):

#     user = get_current_user()

#     if not user:
#         return jsonify({
#             "message": "User not found"
#         }), 404

#     custom_order = db.session.get(CustomOrder, order_id)

#     if not custom_order:
#         return jsonify({
#             "message": "Custom order not found"
#         }), 404

#     # Admin should use the admin status endpoint
#     if is_admin(user):
#         return jsonify({
#             "message": "Use the admin update endpoint for admin changes"
#         }), 403

#     # Ownership check
#     if custom_order.user_id != user.id:
#         return jsonify({
#             "message": "You are not authorized to update this custom order"
#         }), 403

#     # Customer cannot modify after quote/acceptance
#     if custom_order.status not in ["pending", "reviewing"]:
#         return jsonify({
#             "message": (
#                 "This custom order cannot be updated "
#                 "in its current status"
#             )
#         }), 400

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     # Update title
#     if "title" in data:

#         if not data["title"]:
#             return jsonify({
#                 "message": "Title cannot be empty"
#             }), 400

#         custom_order.title = str(data["title"]).strip()

#     # Update description
#     if "description" in data:

#         if not data["description"]:
#             return jsonify({
#                 "message": "Description cannot be empty"
#             }), 400

#         custom_order.description = str(
#             data["description"]
#         ).strip()

#     # Update customization details
#     if "customization_details" in data:
#         custom_order.customization_details = data[
#             "customization_details"
#         ]

#     # Update reference image
#     if "reference_image_url" in data:
#         custom_order.reference_image_url = data[
#             "reference_image_url"
#         ]

#     # Update quantity
#     if "quantity" in data:

#         try:
#             quantity = int(data["quantity"])
#         except (ValueError, TypeError):
#             return jsonify({
#                 "message": "Quantity must be a valid number"
#             }), 400

#         if quantity <= 0:
#             return jsonify({
#                 "message": "Quantity must be greater than 0"
#             }), 400

#         custom_order.quantity = quantity

#     custom_order.updated_at = datetime.utcnow()

#     db.session.commit()

#     return jsonify({
#         "message": "Custom order updated successfully",
#         "custom_order": custom_order_to_dict(custom_order)
#     }), 200


# # =========================================================
# # 5. CANCEL CUSTOM ORDER
# # =========================================================

# @custom_order_bp.route("/<int:order_id>", methods=["DELETE"])
# @jwt_required()
# def cancel_custom_order(order_id):

#     user = get_current_user()

#     if not user:
#         return jsonify({
#             "message": "User not found"
#         }), 404

#     custom_order = db.session.get(CustomOrder, order_id)

#     if not custom_order:
#         return jsonify({
#             "message": "Custom order not found"
#         }), 404

#     # Customer ownership
#     if not is_admin(user) and custom_order.user_id != user.id:
#         return jsonify({
#             "message": "You are not authorized to cancel this order"
#         }), 403

#     # Cannot cancel completed/rejected/cancelled orders
#     if custom_order.status in [
#         "completed",
#         "rejected",
#         "cancelled"
#     ]:
#         return jsonify({
#             "message": (
#                 "This custom order cannot be cancelled "
#                 "in its current status"
#             )
#         }), 400

#     custom_order.status = "cancelled"
#     custom_order.updated_at = datetime.utcnow()

#     db.session.commit()

#     return jsonify({
#         "message": "Custom order cancelled successfully",
#         "custom_order": custom_order_to_dict(custom_order)
#     }), 200


# # =========================================================
# # 6. ADMIN UPDATE CUSTOM ORDER
# # =========================================================

# @custom_order_bp.route("/<int:order_id>/admin", methods=["PUT"])
# @jwt_required()
# def admin_update_custom_order(order_id):

#     user = get_current_user()

#     if not user:
#         return jsonify({
#             "message": "User not found"
#         }), 404

#     # Admin only
#     if not is_admin(user):
#         return jsonify({
#             "message": "Admin access required"
#         }), 403

#     custom_order = db.session.get(CustomOrder, order_id)

#     if not custom_order:
#         return jsonify({
#             "message": "Custom order not found"
#         }), 404

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     # -----------------------------------------------------
#     # Status
#     # -----------------------------------------------------

#     if "status" in data:

#         allowed_statuses = [
#             "pending",
#             "reviewing",
#             "quoted",
#             "accepted",
#             "rejected",
#             "cancelled",
#             "completed"
#         ]

#         status = str(data["status"]).lower().strip()

#         if status not in allowed_statuses:
#             return jsonify({
#                 "message": "Invalid status",
#                 "allowed_statuses": allowed_statuses
#             }), 400

#         custom_order.status = status

#     # -----------------------------------------------------
#     # Estimated Price
#     # -----------------------------------------------------

#     if "estimated_price" in data:

#         if data["estimated_price"] is None:
#             custom_order.estimated_price = None

#         else:
#             try:
#                 estimated_price = Decimal(
#                     str(data["estimated_price"])
#                 )
#             except (InvalidOperation, ValueError, TypeError):
#                 return jsonify({
#                     "message": "Invalid estimated_price"
#                 }), 400

#             if estimated_price < 0:
#                 return jsonify({
#                     "message": "Estimated price cannot be negative"
#                 }), 400

#             custom_order.estimated_price = estimated_price

#     # -----------------------------------------------------
#     # Admin Notes
#     # -----------------------------------------------------

#     if "admin_notes" in data:
#         custom_order.admin_notes = data["admin_notes"]

#     custom_order.updated_at = datetime.utcnow()

#     db.session.commit()

#     return jsonify({
#         "message": "Custom order updated by admin successfully",
#         "custom_order": custom_order_to_dict(custom_order)
#     }), 200


# # =========================================================
# # 7. ADMIN DELETE / CANCEL CUSTOM ORDER
# # =========================================================

# @custom_order_bp.route("/<int:order_id>/admin/cancel", methods=["PUT"])
# @jwt_required()
# def admin_cancel_custom_order(order_id):

#     user = get_current_user()

#     if not user:
#         return jsonify({
#             "message": "User not found"
#         }), 404

#     if not is_admin(user):
#         return jsonify({
#             "message": "Admin access required"
#         }), 403

#     custom_order = db.session.get(CustomOrder, order_id)

#     if not custom_order:
#         return jsonify({
#             "message": "Custom order not found"
#         }), 404

#     custom_order.status = "cancelled"
#     custom_order.updated_at = datetime.utcnow()

#     db.session.commit()

#     return jsonify({
#         "message": "Custom order cancelled by admin",
#         "custom_order": custom_order_to_dict(custom_order)
#     }), 200

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.user import User

from services.custom_order_service import (
    create_custom_order,
    get_user_custom_orders,
    get_user_custom_order,
    get_custom_order_by_id,
    update_custom_order,
    cancel_custom_order,
    accept_custom_order,
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
        product_id=data.get("product_id")
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

    return jsonify({
        "message": "Custom order quotation accepted successfully",
        "custom_order": custom_order_to_dict(custom_order)
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

    return jsonify({
        "message": "Custom order updated by admin successfully",
        "custom_order": custom_order_to_dict(custom_order)
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

    return jsonify({
        "message": "Custom order rejected successfully",
        "custom_order": custom_order_to_dict(custom_order)
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

    return jsonify({
        "message": "Custom order cancelled by admin",
        "custom_order": custom_order_to_dict(custom_order)
    }), 200


# =========================================================
# ADMIN SET QUOTE
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

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    if data.get("estimated_price") is None:
        return jsonify({
            "message": "estimated_price is required"
        }), 400

    custom_order, error = set_custom_order_quote(
        custom_order_id=order_id,
        estimated_price=data.get("estimated_price"),
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

    return jsonify({
        "message": "Custom order quotation created successfully",
        "custom_order": custom_order_to_dict(custom_order)
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

    return jsonify({
        "message": "Custom order status updated successfully",
        "custom_order": custom_order_to_dict(custom_order)
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