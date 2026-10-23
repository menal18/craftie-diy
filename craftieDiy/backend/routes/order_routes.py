# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from datetime import datetime
# from decimal import Decimal
# import random

# from extensions import db
# from models.order import Order
# from models.order_item import OrderItem
# from models.cart import Cart
# from models.cart_item import CartItem
# from models.product import Product
# from models.address import Address


# order_bp = Blueprint(
#     "order",
#     __name__,
#     url_prefix="/api/orders"
# )


# # =========================================================
# # HELPER: Generate unique order number
# # =========================================================
# def generate_order_number():

#     while True:
#         date_part = datetime.utcnow().strftime("%Y%m%d")
#         random_part = random.randint(1000, 9999)

#         order_number = f"CT-{date_part}-{random_part}"

#         existing = Order.query.filter_by(
#             order_number=order_number
#         ).first()

#         if not existing:
#             return order_number


# # =========================================================
# # HELPER: Convert order to JSON
# # =========================================================
# def order_to_dict(order):

#     items = []

#     for item in order.items:

#         items.append({
#             "id": item.id,
#             "product_id": item.product_id,
#             "product_name": item.product_name,
#             "quantity": item.quantity,
#             "unit_price": float(item.unit_price),
#             "subtotal": float(item.subtotal)
#         })

#     return {
#         "id": order.id,
#         "order_number": order.order_number,
#         "user_id": order.user_id,
#         "address_id": order.address_id,

#         "subtotal": float(order.subtotal),
#         "delivery_charge": float(order.delivery_charge),
#         "discount": float(order.discount),
#         "total": float(order.total),

#         "payment_method": order.payment_method,
#         "payment_status": order.payment_status,
#         "order_status": order.order_status,

#         "notes": order.notes,

#         "items": items,

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
# # CREATE ORDER
# # =========================================================
# @order_bp.route("", methods=["POST"])
# @jwt_required()
# def create_order():

#     user_id = int(get_jwt_identity())

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     address_id = data.get("address_id")
#     payment_method = data.get(
#         "payment_method",
#         "COD"
#     ).strip().upper()

#     notes = data.get("notes")

#     # -----------------------------------------------------
#     # Validate address
#     # -----------------------------------------------------
#     if not address_id:
#         return jsonify({
#             "message": "address_id is required"
#         }), 400

#     address = Address.query.filter_by(
#         id=address_id,
#         user_id=user_id
#     ).first()

#     if not address:
#         return jsonify({
#             "message": "Address not found"
#         }), 404

#     # -----------------------------------------------------
#     # Validate payment method
#     # -----------------------------------------------------
#     allowed_payment_methods = [
#         "COD",
#         "CARD",
#         "UPI",
#         "STRIPE"
#     ]

#     if payment_method not in allowed_payment_methods:
#         return jsonify({
#             "message": "Invalid payment method"
#         }), 400

#     # -----------------------------------------------------
#     # Get user's cart
#     # -----------------------------------------------------
#     cart = Cart.query.filter_by(
#         user_id=user_id
#     ).first()

#     if not cart:
#         return jsonify({
#             "message": "Cart is empty"
#         }), 400

#     cart_items = CartItem.query.filter_by(
#         cart_id=cart.id
#     ).all()

#     if not cart_items:
#         return jsonify({
#             "message": "Cart is empty"
#         }), 400

#     # -----------------------------------------------------
#     # Calculate subtotal
#     #
#     # IMPORTANT:
#     # We use the current product price only.
#     #
#     # We DO NOT calculate/apply Promotion here.
#     # This prevents the same product promotion from being
#     # applied a second time during checkout.
#     # -----------------------------------------------------
#     subtotal = Decimal("0.00")

#     validated_items = []

#     for cart_item in cart_items:

#         product = Product.query.filter_by(
#             id=cart_item.product_id,
#             is_active=True
#         ).first()

#         if not product:
#             return jsonify({
#                 "message": f"Product ID {cart_item.product_id} is no longer available"
#             }), 400

#         # -------------------------------------------------
#         # Stock validation
#         # -------------------------------------------------
#         if product.stock_quantity <= 0:
#             return jsonify({
#                 "message": f"{product.name} is out of stock"
#             }), 400

#         if cart_item.quantity > product.stock_quantity:
#             return jsonify({
#                 "message": (
#                     f"Only {product.stock_quantity} "
#                     f"{product.name} available"
#                 )
#             }), 400

#         unit_price = Decimal(str(product.price))

#         item_subtotal = unit_price * cart_item.quantity

#         subtotal += item_subtotal

#         validated_items.append({
#             "cart_item": cart_item,
#             "product": product,
#             "unit_price": unit_price,
#             "subtotal": item_subtotal
#         })

#     # -----------------------------------------------------
#     # Delivery charge
#     #
#     # Default = 0 for now.
#     # Can be replaced later with pincode/area logic.
#     # -----------------------------------------------------
#     delivery_charge = Decimal("0.00")

#     # -----------------------------------------------------
#     # Order-level discount
#     #
#     # IMPORTANT:
#     # This is NOT a product promotion calculation.
#     #
#     # Later:
#     # Promo Code / Loyalty can provide this value.
#     # -----------------------------------------------------
#     discount = Decimal("0.00")

#     requested_discount = data.get(
#         "discount",
#         0
#     )

#     try:
#         requested_discount = Decimal(
#             str(requested_discount)
#         )
#     except Exception:
#         return jsonify({
#             "message": "Invalid discount value"
#         }), 400

#     if requested_discount < 0:
#         return jsonify({
#             "message": "Discount cannot be negative"
#         }), 400

#     # Never allow discount greater than subtotal
#     discount = min(
#         requested_discount,
#         subtotal
#     )

#     # -----------------------------------------------------
#     # Calculate final total
#     # -----------------------------------------------------
#     total = (
#         subtotal
#         + delivery_charge
#         - discount
#     )

#     if total < 0:
#         total = Decimal("0.00")

#     # -----------------------------------------------------
#     # Create Order
#     # -----------------------------------------------------
#     order = Order(
#         order_number=generate_order_number(),
#         user_id=user_id,
#         address_id=address.id,

#         subtotal=subtotal,
#         delivery_charge=delivery_charge,
#         discount=discount,
#         total=total,

#         payment_method=payment_method,

#         # COD can be considered pending payment
#         # Other payment methods also start as pending.
#         payment_status="pending",

#         order_status="pending",

#         notes=notes
#     )

#     db.session.add(order)
#     db.session.flush()

#     # -----------------------------------------------------
#     # Create Order Items
#     # -----------------------------------------------------
#     for item_data in validated_items:

#         cart_item = item_data["cart_item"]
#         product = item_data["product"]
#         unit_price = item_data["unit_price"]
#         item_subtotal = item_data["subtotal"]

#         order_item = OrderItem(
#             order_id=order.id,
#             product_id=product.id,
#             product_name=product.name,
#             quantity=cart_item.quantity,
#             unit_price=unit_price,
#             subtotal=item_subtotal
#         )

#         db.session.add(order_item)

#         # -------------------------------------------------
#         # Reduce stock
#         # -------------------------------------------------
#         product.stock_quantity -= cart_item.quantity

#     # -----------------------------------------------------
#     # Clear cart
#     # -----------------------------------------------------
#     for cart_item in cart_items:
#         db.session.delete(cart_item)

#     cart.updated_at = datetime.utcnow()

#     # -----------------------------------------------------
#     # Save everything
#     # -----------------------------------------------------
#     db.session.commit()

#     return jsonify({
#         "message": "Order created successfully",
#         "order": order_to_dict(order)
#     }), 201


# # =========================================================
# # GET MY ORDERS
# # =========================================================
# @order_bp.route("", methods=["GET"])
# @jwt_required()
# def get_my_orders():

#     user_id = int(get_jwt_identity())

#     orders = Order.query.filter_by(
#         user_id=user_id
#     ).order_by(
#         Order.created_at.desc()
#     ).all()

#     return jsonify({
#         "orders": [
#             order_to_dict(order)
#             for order in orders
#         ]
#     }), 200


# # =========================================================
# # GET SINGLE ORDER
# # =========================================================
# @order_bp.route("/<int:order_id>", methods=["GET"])
# @jwt_required()
# def get_order(order_id):

#     user_id = int(get_jwt_identity())

#     order = Order.query.filter_by(
#         id=order_id,
#         user_id=user_id
#     ).first()

#     if not order:
#         return jsonify({
#             "message": "Order not found"
#         }), 404

#     return jsonify({
#         "order": order_to_dict(order)
#     }), 200


# # =========================================================
# # CANCEL ORDER
# # =========================================================
# @order_bp.route("/<int:order_id>/cancel", methods=["PUT"])
# @jwt_required()
# def cancel_order(order_id):

#     user_id = int(get_jwt_identity())

#     order = Order.query.filter_by(
#         id=order_id,
#         user_id=user_id
#     ).first()

#     if not order:
#         return jsonify({
#             "message": "Order not found"
#         }), 404

#     # -----------------------------------------------------
#     # Check whether order can be cancelled
#     # -----------------------------------------------------
#     if order.order_status in [
#         "delivered",
#         "cancelled"
#     ]:
#         return jsonify({
#             "message": (
#                 f"Order cannot be cancelled because "
#                 f"it is already {order.order_status}"
#             )
#         }), 400

#     # -----------------------------------------------------
#     # Restore product stock
#     # -----------------------------------------------------
#     for item in order.items:

#         if item.product_id:

#             product = Product.query.get(
#                 item.product_id
#             )

#             if product:
#                 product.stock_quantity += item.quantity

#     order.order_status = "cancelled"
#     order.updated_at = datetime.utcnow()

#     db.session.commit()

#     return jsonify({
#         "message": "Order cancelled successfully",
#         "order": order_to_dict(order)
#     }), 200


# # =========================================================
# # UPDATE ORDER STATUS
# # =========================================================
# @order_bp.route("/<int:order_id>/status", methods=["PUT"])
# @jwt_required()
# def update_order_status(order_id):

#     user_id = int(get_jwt_identity())

#     order = Order.query.get(order_id)

#     if not order:
#         return jsonify({
#             "message": "Order not found"
#         }), 404

#     # -----------------------------------------------------
#     # Basic ownership check
#     # -----------------------------------------------------
#     if order.user_id != user_id:
#         return jsonify({
#             "message": "You are not authorized to update this order"
#         }), 403

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     new_status = data.get(
#         "order_status"
#     )

#     if not new_status:
#         return jsonify({
#             "message": "order_status is required"
#         }), 400

#     new_status = new_status.strip().lower()

#     allowed_statuses = [
#         "pending",
#         "confirmed",
#         "processing",
#         "shipped",
#         "out_for_delivery",
#         "delivered",
#         "cancelled"
#     ]

#     if new_status not in allowed_statuses:
#         return jsonify({
#             "message": "Invalid order status"
#         }), 400

#     order.order_status = new_status
#     order.updated_at = datetime.utcnow()

#     db.session.commit()

#     return jsonify({
#         "message": "Order status updated successfully",
#         "order": order_to_dict(order)
#     }), 200
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from middleware.admin_required import admin_required
from extensions import db
from models.order import Order
from services.notification_service import create_order_notification

from services.order_service import (
    create_order,
    get_user_orders,
    get_user_order,
    cancel_user_order,
    update_order_status,
    order_to_dict
)


order_bp = Blueprint(
    "order",
    __name__,
    url_prefix="/api/orders"
)


# =========================================================
# CREATE ORDER
# =========================================================

@order_bp.route("", methods=["POST"])
@jwt_required()
def create_order_route():

    user_id = int(get_jwt_identity())

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    address_id = data.get("address_id")

    if not address_id:
        return jsonify({
            "message": "address_id is required"
        }), 400

    payment_method = data.get(
        "payment_method",
        "COD"
    )

    if not isinstance(payment_method, str):
        return jsonify({
            "message": "Invalid payment method"
        }), 400

    notes = data.get("notes")
    promo_code = data.get("promo_code")

    if promo_code is not None and not isinstance(promo_code, str):
        return jsonify({
            "message": "promo_code must be a string"
        }), 400

    order, error = create_order(
        user_id=user_id,
        address_id=address_id,
        payment_method=payment_method,
        notes=notes,
        promo_code=promo_code
    )

    if error:
        if error == "Address not found":
            return jsonify({
                "message": error
            }), 404

        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Order created successfully",
        "order": order_to_dict(order)
    }), 201


# =========================================================
# GET MY ORDERS
# =========================================================

@order_bp.route("", methods=["GET"])
@jwt_required()
def get_my_orders():

    user_id = int(get_jwt_identity())

    orders = get_user_orders(user_id)

    return jsonify({
        "orders": [
            order_to_dict(order)
            for order in orders
        ]
    }), 200


# =========================================================
# GET SINGLE ORDER
# =========================================================

@order_bp.route("/<int:order_id>", methods=["GET"])
@jwt_required()
def get_order(order_id):

    user_id = int(get_jwt_identity())

    order = get_user_order(
        user_id,
        order_id
    )

    if not order:
        return jsonify({
            "message": "Order not found"
        }), 404

    return jsonify({
        "order": order_to_dict(order)
    }), 200


# =========================================================
# CANCEL ORDER
# =========================================================

@order_bp.route(
    "/<int:order_id>/cancel",
    methods=["PUT"]
)
@jwt_required()
def cancel_order(order_id):

    user_id = int(get_jwt_identity())

    order, error = cancel_user_order(
        user_id,
        order_id
    )

    if error:
        return jsonify({
            "message": error
        }), 400 if error != "Order not found" else 404

    return jsonify({
        "message": "Order cancelled successfully",
        "order": order_to_dict(order)
    }), 200


# =========================================================
# UPDATE ORDER STATUS
# =========================================================

@order_bp.route(
    "/<int:order_id>/status",
    methods=["PUT"]
)
@admin_required
def update_order_status_route(order_id):


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

    if not isinstance(new_status, str):
        return jsonify({
            "message": "Invalid order status"
        }), 400

    previous_order = db.session.get(Order, order_id)
    previous_status = (
        previous_order.order_status
        if previous_order
        else None
    )

    order, error = update_order_status(
        order_id=order_id,
        new_status=new_status
    )

    if error:
        return jsonify({
            "message": error
        }), 400 if error != "Order not found" else 404

    notification = None
    notification_error = None
    if previous_status != order.order_status:
        notification, notification_error = create_order_notification(
            user_id=order.user_id,
            order_id=order.id,
            title="Order Status Updated",
            message=(
                f"Your order {order.order_number or f'#{order.id}'} is now "
                f"{order.order_status.replace('_', ' ')}."
            ),
            idempotency_key=f"ord-{order.id}-{order.order_status}",
        )

    if notification_error:
        current_app.logger.error(
            "Could not create status notification for order %s: %s",
            order.id,
            notification_error,
        )

    return jsonify({
        "message": "Order status updated successfully",
        "order": order_to_dict(order),
        "notification_created": notification is not None,
    }), 200