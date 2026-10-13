from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from decimal import Decimal, InvalidOperation

from extensions import db
from models.payment import Payment
from models.order import Order
from models.user import User


payment_bp = Blueprint(
    "payment",
    __name__,
    url_prefix="/api/payments"
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
    if not user:
        return False

    return str(user.role).lower() == "admin"


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
        ),
        "updated_at": (
            payment.updated_at.isoformat()
            if payment.updated_at
            else None
        )
    }


# =========================================================
# 1. CREATE PAYMENT
# =========================================================

@payment_bp.route("", methods=["POST"])
@jwt_required()
def create_payment():

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

    # -----------------------------------------------------
    # Order ID
    # -----------------------------------------------------

    order_id = data.get("order_id")

    if not order_id:
        return jsonify({
            "message": "order_id is required"
        }), 400

    try:
        order_id = int(order_id)
    except (ValueError, TypeError):
        return jsonify({
            "message": "Invalid order_id"
        }), 400

    order = db.session.get(Order, order_id)

    if not order:
        return jsonify({
            "message": "Order not found"
        }), 404

    # -----------------------------------------------------
    # Ownership
    # -----------------------------------------------------

    if not is_admin(user) and order.user_id != user.id:
        return jsonify({
            "message": "You are not authorized to make payment for this order"
        }), 403

    # -----------------------------------------------------
    # Payment method
    # -----------------------------------------------------

    payment_method = data.get("payment_method")

    if not payment_method:
        return jsonify({
            "message": "payment_method is required"
        }), 400

    payment_method = str(payment_method).upper().strip()

    allowed_methods = [
        "COD",
        "UPI",
        "CARD",
        "STRIPE"
    ]

    if payment_method not in allowed_methods:
        return jsonify({
            "message": "Invalid payment method",
            "allowed_methods": allowed_methods
        }), 400

    # -----------------------------------------------------
    # Check existing payment
    # -----------------------------------------------------

    existing_payment = Payment.query.filter_by(
        order_id=order.id
    ).first()

    if existing_payment:
        return jsonify({
            "message": "Payment already exists for this order",
            "payment": payment_to_dict(existing_payment)
        }), 409

    # -----------------------------------------------------
    # Amount
    # -----------------------------------------------------

    amount = data.get("amount")

    if amount is None:
        amount = order.total

    try:
        amount = Decimal(str(amount))
    except (InvalidOperation, ValueError, TypeError):
        return jsonify({
            "message": "Invalid payment amount"
        }), 400

    if amount <= 0:
        return jsonify({
            "message": "Payment amount must be greater than 0"
        }), 400

    # Do not allow customer to pay more/less than order total
    order_total = Decimal(str(order.total))

    if amount != order_total:
        return jsonify({
            "message": "Payment amount must match the order total",
            "order_total": float(order_total)
        }), 400

    # -----------------------------------------------------
    # Currency
    # -----------------------------------------------------

    currency = data.get("currency", "INR")

    currency = str(currency).upper().strip()

    allowed_currencies = [
        "INR",
        "USD",
        "AED",
        "SAR",
        "KWD",
        "SGD"
    ]

    if currency not in allowed_currencies:
        return jsonify({
            "message": "Invalid currency",
            "allowed_currencies": allowed_currencies
        }), 400

    # -----------------------------------------------------
    # Transaction ID
    # -----------------------------------------------------

    transaction_id = data.get("transaction_id")

    # -----------------------------------------------------
    # Payment status
    # -----------------------------------------------------

    status = data.get("status", "pending")
    status = str(status).lower().strip()

    allowed_statuses = [
        "pending",
        "paid",
        "failed",
        "refunded"
    ]

    if status not in allowed_statuses:
        return jsonify({
            "message": "Invalid payment status",
            "allowed_statuses": allowed_statuses
        }), 400

    # COD should initially be pending
    if payment_method == "COD":
        status = "pending"

    # -----------------------------------------------------
    # Create payment
    # -----------------------------------------------------

    payment = Payment(
        order_id=order.id,
        payment_method=payment_method,
        transaction_id=transaction_id,
        amount=amount,
        currency=currency,
        status=status
    )

    # If payment is already paid
    if status == "paid":
        payment.payment_date = datetime.utcnow()

        order.payment_status = "paid"

    else:
        order.payment_status = "pending"

    db.session.add(payment)
    db.session.commit()

    return jsonify({
        "message": "Payment created successfully",
        "payment": payment_to_dict(payment)
    }), 201


# =========================================================
# 2. GET MY PAYMENTS
# =========================================================

@payment_bp.route("", methods=["GET"])
@jwt_required()
def get_payments():

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if is_admin(user):

        payments = Payment.query.order_by(
            Payment.created_at.desc()
        ).all()

    else:

        payments = (
            Payment.query
            .join(Order)
            .filter(Order.user_id == user.id)
            .order_by(Payment.created_at.desc())
            .all()
        )

    return jsonify({
        "count": len(payments),
        "payments": [
            payment_to_dict(payment)
            for payment in payments
        ]
    }), 200


# =========================================================
# 3. GET SINGLE PAYMENT
# =========================================================

@payment_bp.route("/<int:payment_id>", methods=["GET"])
@jwt_required()
def get_payment(payment_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    payment = db.session.get(Payment, payment_id)

    if not payment:
        return jsonify({
            "message": "Payment not found"
        }), 404

    order = db.session.get(Order, payment.order_id)

    if not order:
        return jsonify({
            "message": "Associated order not found"
        }), 404

    if not is_admin(user) and order.user_id != user.id:
        return jsonify({
            "message": "You are not authorized to view this payment"
        }), 403

    return jsonify({
        "payment": payment_to_dict(payment)
    }), 200


# =========================================================
# 4. GET PAYMENT BY ORDER
# =========================================================

@payment_bp.route("/order/<int:order_id>", methods=["GET"])
@jwt_required()
def get_order_payment(order_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    order = db.session.get(Order, order_id)

    if not order:
        return jsonify({
            "message": "Order not found"
        }), 404

    if not is_admin(user) and order.user_id != user.id:
        return jsonify({
            "message": "You are not authorized to view this payment"
        }), 403

    payment = Payment.query.filter_by(
        order_id=order_id
    ).first()

    if not payment:
        return jsonify({
            "message": "Payment not found for this order"
        }), 404

    return jsonify({
        "payment": payment_to_dict(payment)
    }), 200


# =========================================================
# 5. UPDATE PAYMENT STATUS
# =========================================================

@payment_bp.route("/<int:payment_id>/status", methods=["PUT"])
@jwt_required()
def update_payment_status(payment_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    # Admin only
    if not is_admin(user):
        return jsonify({
            "message": "Admin access required"
        }), 403

    payment = db.session.get(Payment, payment_id)

    if not payment:
        return jsonify({
            "message": "Payment not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    status = data.get("status")

    if not status:
        return jsonify({
            "message": "status is required"
        }), 400

    status = str(status).lower().strip()

    allowed_statuses = [
        "pending",
        "paid",
        "failed",
        "refunded"
    ]

    if status not in allowed_statuses:
        return jsonify({
            "message": "Invalid payment status",
            "allowed_statuses": allowed_statuses
        }), 400

    payment.status = status

    order = db.session.get(Order, payment.order_id)

    if status == "paid":

        payment.payment_date = datetime.utcnow()

        if order:
            order.payment_status = "paid"

    elif status == "failed":

        if order:
            order.payment_status = "failed"

    elif status == "refunded":

        if order:
            order.payment_status = "refunded"

    elif status == "pending":

        if order:
            order.payment_status = "pending"

    payment.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        "message": "Payment status updated successfully",
        "payment": payment_to_dict(payment)
    }), 200


# =========================================================
# 6. REFUND PAYMENT
# =========================================================

@payment_bp.route("/<int:payment_id>/refund", methods=["PUT"])
@jwt_required()
def refund_payment(payment_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if not is_admin(user):
        return jsonify({
            "message": "Admin access required"
        }), 403

    payment = db.session.get(Payment, payment_id)

    if not payment:
        return jsonify({
            "message": "Payment not found"
        }), 404

    if payment.status != "paid":
        return jsonify({
            "message": "Only paid payments can be refunded"
        }), 400

    payment.status = "refunded"
    payment.updated_at = datetime.utcnow()

    order = db.session.get(Order, payment.order_id)

    if order:
        order.payment_status = "refunded"

    db.session.commit()

    return jsonify({
        "message": "Payment refunded successfully",
        "payment": payment_to_dict(payment)
    }), 200