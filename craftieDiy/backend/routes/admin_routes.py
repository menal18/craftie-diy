from flask import Blueprint, jsonify,request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

from extensions import db
from models.user import User
from models.product import Product
from models.category import Category
from models.order import Order, utc_timestamp_iso
from models.custom_order import CustomOrder
from models.payment import Payment
from services.admin_service import (
    get_all_reviews,
    delete_review_by_admin,
    get_admin_profile,
    update_admin_profile
)

admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin"
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


def admin_required():
    user = get_current_user()

    if not user:
        return None, (
            jsonify({
                "message": "User not found"
            }),
            404
        )

    if str(user.role).lower() != "admin":
        return None, (
            jsonify({
                "message": "Admin access required"
            }),
            403
        )

    return user, None


def user_to_dict(user):
    return {
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


# def order_to_dict(order):
#     return {
#         "id": order.id,
#         "order_number": order.order_number,
#         "user_id": order.user_id,
#         "address_id": order.address_id,
#         "subtotal": float(order.subtotal or 0),
#         "delivery_charge": float(order.delivery_charge or 0),
#         "promotion_discount": float(order.promotion_discount or 0),
#         "promo_code_id": order.promo_code_id,
#         "promo_code_discount": float(order.promo_code_discount or 0),
#         "discount": float(order.discount or 0),
#         "total": float(order.total or 0),
#         "payment_method": order.payment_method,
#         "payment_status": order.payment_status,
#         "order_status": order.order_status,
#         "notes": order.notes,
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

def order_to_dict(order):
    user = order.user
    address = order.address
    order_items = []

    for item in order.items:
        product = item.product
        images = product.images if product else []
        primary_image = next(
            (image for image in images if image.is_primary),
            None,
        )
        image_url = (
            primary_image.image_url
            if primary_image
            else images[0].image_url
            if images
            else product.image_url
            if product
            else None
        )

        order_items.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product_name,
            "quantity": item.quantity,
            "unit_price": float(item.unit_price or 0),
            "subtotal": float(item.subtotal or 0),
            "image_url": image_url,
            "product": (
                {
                    "id": product.id,
                    "name": product.name,
                    "image_url": image_url,
                    "images": [
                        {
                            "image_url": image.image_url,
                            "is_primary": image.is_primary,
                            "display_order": image.display_order,
                        }
                        for image in images
                    ],
                }
                if product
                else None
            ),
        })

    return {
        # =====================================================
        # ORDER BASIC DETAILS
        # =====================================================
        "id": order.id,
        "order_number": order.order_number,

        # =====================================================
        # CUSTOMER DETAILS
        # =====================================================
        "user_id": order.user_id,

        "customer": {
            "id": user.id if user else None,
            "name": user.name if user else None,
            "email": user.email if user else None,
            "phone": user.phone if user else None,
        },

        # =====================================================
        # DELIVERY ADDRESS
        # =====================================================
        "address_id": order.address_id,

        "address": (
            {
                "id": address.id,
                "full_name": address.full_name,
                "phone": address.phone,
                "address_line1": address.address_line1,
                "address_line2": address.address_line2,
                "city": address.city,
                "state": address.state,
                "postal_code": address.postal_code,
                "country": address.country,
                "address_type": address.address_type,
            }
            if address
            else None
        ),

        # =====================================================
        # ORDER ITEMS
        # =====================================================
        "items": order_items,

        # =====================================================
        # PRICING
        # =====================================================
        "subtotal": float(order.subtotal or 0),

        "delivery_charge": float(
            order.delivery_charge or 0
        ),

        "promotion_discount": float(
            order.promotion_discount or 0
        ),

        # =====================================================
        # PROMO CODE
        # =====================================================
        "promo_code_id": order.promo_code_id,

        "promo_code": (
            order.promo_code.code
            if order.promo_code
            else None
        ),

        "promo_code_discount": float(
            order.promo_code_discount or 0
        ),

        "discount": float(
            order.discount or 0
        ),

        "total": float(
            order.total or 0
        ),

        # =====================================================
        # PAYMENT
        # =====================================================
        "payment_method": order.payment_method,

        "payment_status": order.payment_status,

        # =====================================================
        # ORDER STATUS
        # =====================================================
        "order_status": order.order_status,

        # =====================================================
        # NOTES
        # =====================================================
        "notes": order.notes,

        # =====================================================
        # DATES
        # =====================================================
        "created_at": (
            utc_timestamp_iso(order.created_at)
        ),

        "updated_at": (
            utc_timestamp_iso(order.updated_at)
        ),
    }

# def custom_order_to_dict(order):
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

def custom_order_to_dict(order):
    user = order.user
    product = order.product

    return {
        # =====================================================
        # BASIC DETAILS
        # =====================================================
        "id": order.id,
        "user_id": order.user_id,
        "product_id": order.product_id,

        # =====================================================
        # CUSTOMER DETAILS
        # =====================================================
        "customer": {
            "id": user.id if user else None,
            "name": user.name if user else None,
            "email": user.email if user else None,
            "phone": user.phone if user else None,
        },

        # =====================================================
        # PRODUCT
        # =====================================================
        "product": (
            {
                "id": product.id,
                "name": product.name,
                "image_url": product.image_url,
            }
            if product
            else None
        ),

        # =====================================================
        # CUSTOM ORDER DETAILS
        # =====================================================
        "title": order.title,

        "description": order.description,

        "customization_details": (
            order.customization_details
        ),

        "reference_image_url": (
            order.reference_image_url
        ),

        "quantity": order.quantity,

        "estimated_price": (
            float(order.estimated_price)
            if order.estimated_price is not None
            else None
        ),

        # =====================================================
        # STATUS
        # =====================================================
        "status": order.status,

        # =====================================================
        # ADMIN
        # =====================================================
        "admin_notes": order.admin_notes,

        # =====================================================
        # DATES
        # =====================================================
        "created_at": (
            order.created_at.isoformat()
            if order.created_at
            else None
        ),

        "updated_at": (
            order.updated_at.isoformat()
            if order.updated_at
            else None
        ),
    }

def payment_to_dict(payment):
    return {
        "id": payment.id,
        "order_id": payment.order_id,
        "payment_method": payment.payment_method,
        "transaction_id": payment.transaction_id,
        "amount": (
            float(payment.amount)
            if payment.amount is not None
            else None
        ),
        "currency": payment.currency,
        "status": payment.status,
        "payment_date": (
            payment.payment_date.isoformat()
            if payment.payment_date
            else None
        ),
        "created_at": (
            payment.created_at.isoformat()
            if payment.created_at
            else None
        )
    }


# =========================================================
# 1. ADMIN DASHBOARD
# =========================================================

@admin_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def admin_dashboard():

    user, error = admin_required()

    if error:
        return error

    # -----------------------------------------------------
    # Basic counts
    # -----------------------------------------------------

    total_users = User.query.count()

    total_customers = User.query.filter(
        func.lower(User.role) == "customer"
    ).count()

    total_products = Product.query.count()

    active_products = Product.query.filter_by(
        is_active=True
    ).count()

    total_categories = Category.query.count()

    active_categories = Category.query.filter_by(
        is_active=True
    ).count()

    total_orders = Order.query.count()

    pending_orders = Order.query.filter(
        func.lower(Order.order_status) == "pending"
    ).count()

    completed_orders = Order.query.filter(
        func.lower(Order.order_status) == "completed"
    ).count()

    cancelled_orders = Order.query.filter(
        func.lower(Order.order_status) == "cancelled"
    ).count()

    total_custom_orders = CustomOrder.query.count()

    pending_custom_orders = CustomOrder.query.filter(
        func.lower(CustomOrder.status) == "pending"
    ).count()

    quoted_custom_orders = CustomOrder.query.filter(
        func.lower(CustomOrder.status) == "quoted"
    ).count()

    accepted_custom_orders = CustomOrder.query.filter(
        func.lower(CustomOrder.status) == "accepted"
    ).count()

    total_payments = Payment.query.count()

    paid_payments = Payment.query.filter(
        func.lower(Payment.status) == "paid"
    ).count()

    pending_payments = Payment.query.filter(
        func.lower(Payment.status) == "pending"
    ).count()

    failed_payments = Payment.query.filter(
        func.lower(Payment.status) == "failed"
    ).count()

    refunded_payments = Payment.query.filter(
        func.lower(Payment.status) == "refunded"
    ).count()

    # -----------------------------------------------------
    # Revenue
    # -----------------------------------------------------

    revenue_result = db.session.query(
        func.coalesce(
            func.sum(Order.total),
            0
        )
    ).filter(
        func.lower(Order.payment_status) == "paid"
    ).scalar()

    total_revenue = float(revenue_result or 0)

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return jsonify({
        "message": "Admin dashboard data retrieved successfully",

        "dashboard": {
            "users": {
                "total_users": total_users,
                "total_customers": total_customers
            },

            "products": {
                "total_products": total_products,
                "active_products": active_products
            },

            "categories": {
                "total_categories": total_categories,
                "active_categories": active_categories
            },

            "orders": {
                "total_orders": total_orders,
                "pending_orders": pending_orders,
                "completed_orders": completed_orders,
                "cancelled_orders": cancelled_orders
            },

            "custom_orders": {
                "total_custom_orders": total_custom_orders,
                "pending_custom_orders": pending_custom_orders,
                "quoted_custom_orders": quoted_custom_orders,
                "accepted_custom_orders": accepted_custom_orders
            },

            "payments": {
                "total_payments": total_payments,
                "paid_payments": paid_payments,
                "pending_payments": pending_payments,
                "failed_payments": failed_payments,
                "refunded_payments": refunded_payments
            },

            "revenue": {
                "total_revenue": total_revenue
            }
        }
    }), 200


# =========================================================
# 2. GET ALL USERS
# =========================================================

@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def admin_get_users():

    user, error = admin_required()

    if error:
        return error

    users = User.query.order_by(
        User.created_at.desc()
    ).all()

    return jsonify({
        "count": len(users),
        "users": [
            user_to_dict(item)
            for item in users
        ]
    }), 200


# =========================================================
# 2.1 UPDATE USER ROLE
# =========================================================

@admin_bp.route("/users/<int:user_id>/role", methods=["PUT"])
@jwt_required()
def admin_update_user_role(user_id):

    user, error = admin_required()

    if error:
        return error

    target_user = db.session.get(User, user_id)

    if not target_user:
        return jsonify({
            "message": "User not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    new_role = data.get("role")

    if not new_role:
        return jsonify({
            "message": "Role is required"
        }), 400

    new_role = str(new_role).strip().lower()

    allowed_roles = [
        "customer",
        "admin"
    ]

    if new_role not in allowed_roles:
        return jsonify({
            "message": "Invalid role",
            "allowed_roles": allowed_roles
        }), 400

    # Prevent admin from changing their own role
    if target_user.id == user.id:
        return jsonify({
            "message": "You cannot change your own role"
        }), 400

    target_user.role = new_role

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()

        return jsonify({
            "message": "Failed to update user role",
            "error": str(e)
        }), 500

    return jsonify({
        "message": "User role updated successfully",
        "user": user_to_dict(target_user)
    }), 200

# =========================================================
# 3. GET ALL ORDERS
# =========================================================

@admin_bp.route("/orders", methods=["GET"])
@jwt_required()
def admin_get_orders():

    user, error = admin_required()

    if error:
        return error

    orders = Order.query.order_by(
        Order.created_at.desc()
    ).all()

    return jsonify({
        "count": len(orders),
        "orders": [
            order_to_dict(order)
            for order in orders
        ]
    }), 200

# =========================================================
# 3.1 UPDATE ORDER STATUS
# =========================================================

@admin_bp.route("/orders/<int:order_id>/status", methods=["PUT"])
@jwt_required()
def admin_update_order_status(order_id):

    user, error = admin_required()

    if error:
        return error

    order = db.session.get(Order, order_id)

    if not order:
        return jsonify({
            "message": "Order not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    new_status = data.get("order_status")

    if not new_status:
        return jsonify({
            "message": "order_status is required"
        }), 400

    new_status = str(new_status).strip().lower()

    allowed_statuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "completed",
        "cancelled"
    ]

    if new_status not in allowed_statuses:
        return jsonify({
            "message": "Invalid order status",
            "allowed_statuses": allowed_statuses
        }), 400

    order.order_status = new_status

    db.session.commit()

    return jsonify({
        "message": "Order status updated successfully",
        "order": order_to_dict(order)
    }), 200


# =========================================================
# 3.2 UPDATE PAYMENT STATUS
# =========================================================

@admin_bp.route("/orders/<int:order_id>/payment-status", methods=["PUT"])
@jwt_required()
def admin_update_payment_status(order_id):

    user, error = admin_required()

    if error:
        return error

    order = db.session.get(Order, order_id)

    if not order:
        return jsonify({
            "message": "Order not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    new_status = data.get("payment_status")

    if not new_status:
        return jsonify({
            "message": "payment_status is required"
        }), 400

    new_status = str(new_status).strip().lower()

    allowed_statuses = [
        "pending",
        "paid",
        "failed",
        "refunded"
    ]

    if new_status not in allowed_statuses:
        return jsonify({
            "message": "Invalid payment status",
            "allowed_statuses": allowed_statuses
        }), 400

    order.payment_status = new_status

    db.session.commit()

    return jsonify({
        "message": "Payment status updated successfully",
        "order": order_to_dict(order)
    }), 200

# =========================================================
# 4. GET ALL CUSTOM ORDERS
# =========================================================

@admin_bp.route("/custom-orders", methods=["GET"])
@jwt_required()
def admin_get_custom_orders():

    user, error = admin_required()

    if error:
        return error

    custom_orders = CustomOrder.query.order_by(
        CustomOrder.created_at.desc()
    ).all()

    return jsonify({
        "count": len(custom_orders),
        "custom_orders": [
            custom_order_to_dict(order)
            for order in custom_orders
        ]
    }), 200


# =========================================================
# 5. GET ALL PAYMENTS
# =========================================================

@admin_bp.route("/payments", methods=["GET"])
@jwt_required()
def admin_get_payments():

    user, error = admin_required()

    if error:
        return error

    payments = Payment.query.order_by(
        Payment.created_at.desc()
    ).all()

    return jsonify({
        "count": len(payments),
        "payments": [
            payment_to_dict(payment)
            for payment in payments
        ]
    }), 200

# =========================================================
# ADMIN REVIEWS
# =========================================================

@admin_bp.route("/reviews", methods=["GET"])
@jwt_required()
def admin_get_reviews():

    current_user = get_current_user()

    if not current_user:
        return jsonify({
            "message": "User not found"
        }), 404

    if str(current_user.role).lower() != "admin":
        return jsonify({
            "message": "Admin access required"
        }), 403

    reviews = get_all_reviews()

    return jsonify({
        "count": len(reviews),
        "reviews": [
            {
                "id": review.id,
                "user_id": review.user_id,
                "user_name": (
                    review.user.name
                    if review.user
                    else None
                ),
                "product_id": review.product_id,
                "product_name": (
                    review.product.name
                    if review.product
                    else None
                ),
                "rating": review.rating,
                "comment": review.comment,
                "created_at": (
                    review.created_at.isoformat()
                    if review.created_at
                    else None
                ),
                "updated_at": (
                    review.updated_at.isoformat()
                    if review.updated_at
                    else None
                )
            }
            for review in reviews
        ]
    }), 200


@admin_bp.route(
    "/reviews/<int:review_id>",
    methods=["DELETE"]
)
@jwt_required()
def admin_delete_review(review_id):

    current_user = get_current_user()

    if not current_user:
        return jsonify({
            "message": "User not found"
        }), 404

    if str(current_user.role).lower() != "admin":
        return jsonify({
            "message": "Admin access required"
        }), 403

    review, error = delete_review_by_admin(
        review_id
    )

    if error:
        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "message": "Review deleted successfully"
    }), 200

# =========================================================
# ADMIN PROFILE / SETTINGS
# =========================================================

@admin_bp.route("/profile", methods=["GET"])
@jwt_required()
def admin_get_profile():

    user, error = admin_required()

    if error:
        return error

    admin_user, service_error = get_admin_profile(
        user.id
    )

    if service_error:
        return jsonify({
            "message": service_error
        }), 404

    return jsonify({
        "message": "Admin profile retrieved successfully",
        "profile": user_to_dict(admin_user)
    }), 200


@admin_bp.route("/profile", methods=["PUT"])
@jwt_required()
def admin_update_profile():

    user, error = admin_required()

    if error:
        return error

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    admin_user, service_error = update_admin_profile(
        user_id=user.id,
        name=data.get("name") if "name" in data else None,
        email=data.get("email") if "email" in data else None,
        phone=data.get("phone") if "phone" in data else None,
        current_password=data.get("current_password"),
        new_password=data.get("new_password")
    )

    if service_error:

        if service_error == "Email already exists":
            return jsonify({
                "message": service_error
            }), 409

        if service_error == "Current password is incorrect":
            return jsonify({
                "message": service_error
            }), 400

        return jsonify({
            "message": service_error
        }), 400

    return jsonify({
        "message": "Admin profile updated successfully",
        "profile": user_to_dict(admin_user)
    }), 200