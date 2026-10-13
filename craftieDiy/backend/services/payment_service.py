import os
import stripe

from decimal import Decimal
from extensions import db
from models.payment import Payment
from models.order import Order


stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


# =========================================================
# CREATE STRIPE PAYMENT INTENT
# =========================================================

def create_stripe_payment_intent(order_id, user_id):
    order = db.session.get(Order, order_id)

    if not order:
        return None, "Order not found"

    # Security: order must belong to logged-in user
    if order.user_id != user_id:
        return None, "You are not authorized to pay for this order"

    # Validate amount
    amount = Decimal(str(order.total))

    if amount <= 0:
        return None, "Order total must be greater than 0"

    # Stripe uses smallest currency unit
    stripe_amount = int(
        (amount * Decimal("100")).quantize(Decimal("1"))
    )

    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=stripe_amount,
            currency="inr",
            automatic_payment_methods={
                "enabled": True
            },
            metadata={
                "order_id": str(order.id),
                "order_number": order.order_number,
                "user_id": str(order.user_id)
            }
        )

    except stripe.error.StripeError as e:
        return None, str(e)

    return payment_intent, None


# =========================================================
# CONFIRM / SYNC STRIPE PAYMENT
# =========================================================

def sync_stripe_payment(order_id, user_id, payment_intent_id):

    order = db.session.get(Order, order_id)

    if not order:
        return None, "Order not found"

    if order.user_id != user_id:
        return None, "You are not authorized to access this order"

    try:
        payment_intent = stripe.PaymentIntent.retrieve(
            payment_intent_id
        )

    except stripe.error.StripeError as e:
        return None, str(e)

    # -----------------------------------------------------
    # Verify PaymentIntent belongs to this order
    # -----------------------------------------------------

    metadata_order_id = payment_intent.metadata.get("order_id")

    if str(metadata_order_id) != str(order.id):
        return None, "Payment does not belong to this order"

    # -----------------------------------------------------
    # Verify Stripe amount
    # -----------------------------------------------------

    expected_amount = int(
        (
            Decimal(str(order.total))
            * Decimal("100")
        ).quantize(Decimal("1"))
    )

    if int(payment_intent.amount) != expected_amount:
        return None, "Stripe payment amount does not match order total"

    stripe_status = payment_intent.status

    # -----------------------------------------------------
    # Map Stripe status to our database status
    # -----------------------------------------------------

    if stripe_status == "succeeded":
        db_status = "paid"

    elif stripe_status in [
        "processing",
        "requires_action",
        "requires_payment_method",
        "requires_confirmation"
    ]:
        db_status = "pending"

    elif stripe_status in [
        "canceled"
    ]:
        db_status = "failed"

    else:
        db_status = "pending"

    # -----------------------------------------------------
    # Existing payment
    # -----------------------------------------------------

    payment = Payment.query.filter_by(
        order_id=order.id
    ).first()

    if payment:

        payment.payment_method = "STRIPE"
        payment.transaction_id = payment_intent.id
        payment.amount = Decimal(str(order.total))
        payment.currency = "INR"
        payment.status = db_status

    else:

        payment = Payment(
            order_id=order.id,
            payment_method="STRIPE",
            transaction_id=payment_intent.id,
            amount=Decimal(str(order.total)),
            currency="INR",
            status=db_status
        )

        db.session.add(payment)

    # -----------------------------------------------------
    # Update order payment status
    # -----------------------------------------------------

    if db_status == "paid":
        order.payment_status = "paid"

        from datetime import datetime

        payment.payment_date = datetime.utcnow()

    elif db_status == "failed":
        order.payment_status = "failed"

    else:
        order.payment_status = "pending"

    db.session.commit()

    return payment_intent, None