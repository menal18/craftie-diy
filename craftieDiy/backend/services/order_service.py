# from datetime import datetime
# from decimal import Decimal

# from extensions import db
# from models.order import Order
# from models.order_item import OrderItem
# from models.cart import Cart
# from models.cart_item import CartItem
# from models.product import Product
# from models.address import Address


# # =========================================================
# # HELPERS
# # =========================================================

# def generate_order_number():
#     """
#     Generate a unique CraftieDIY order number.
#     Example: CT-20260913-A1B2C3
#     """

#     import random
#     import string

#     date_part = datetime.utcnow().strftime("%Y%m%d")

#     random_part = "".join(
#         random.choices(
#             string.ascii_uppercase + string.digits,
#             k=6
#         )
#     )

#     return f"CT-{date_part}-{random_part}"


# def decimal_value(value):
#     """
#     Safely convert a value to Decimal.
#     """

#     if value is None:
#         return Decimal("0.00")

#     try:
#         return Decimal(str(value))
#     except Exception:
#         return Decimal("0.00")


# def order_to_dict(order):
#     """
#     Convert Order model to JSON-friendly dictionary.
#     """

#     return {
#         "id": order.id,
#         "order_number": order.order_number,
#         "user_id": order.user_id,
#         "address_id": order.address_id,

#         "subtotal": float(order.subtotal or 0),
#         "delivery_charge": float(order.delivery_charge or 0),
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


# def order_item_to_dict(item):
#     """
#     Convert OrderItem model to dictionary.
#     """

#     return {
#         "id": item.id,
#         "order_id": item.order_id,
#         "product_id": item.product_id,
#         "product_name": item.product_name,
#         "quantity": item.quantity,
#         "unit_price": float(item.unit_price or 0),
#         "subtotal": float(item.subtotal or 0),

#         "created_at": (
#             item.created_at.isoformat()
#             if item.created_at
#             else None
#         )
#     }


# # =========================================================
# # GET USER CART
# # =========================================================

# def get_user_cart(user_id):
#     """
#     Get the cart belonging to the user.
#     """

#     return Cart.query.filter_by(
#         user_id=user_id
#     ).first()


# # =========================================================
# # CREATE ORDER
# # =========================================================

# def create_order(
#     user_id,
#     address_id,
#     payment_method,
#     discount=0,
#     notes=None,
#     delivery_charge=0,
#     items=None
# ):
#     """
#     Create a new order.

#     Important:
#     The order service does NOT calculate promotions again.

#     The final item prices should already be supplied by
#     the checkout/pricing layer when applicable.

#     This prevents the same promotion from being discounted
#     twice.
#     """

#     # -----------------------------------------------------
#     # Validate address
#     # -----------------------------------------------------

#     address = Address.query.filter_by(
#         id=address_id,
#         user_id=user_id
#     ).first()

#     if not address:
#         return None, "Address not found"

#     # -----------------------------------------------------
#     # Validate payment method
#     # -----------------------------------------------------

#     allowed_payment_methods = [
#         "COD",
#         "CARD",
#         "UPI",
#         "STRIPE"
#     ]

#     payment_method = str(
#         payment_method or ""
#     ).upper()

#     if payment_method not in allowed_payment_methods:
#         return None, "Invalid payment method"

#     # -----------------------------------------------------
#     # Get cart
#     # -----------------------------------------------------

#     cart = get_user_cart(user_id)

#     if not cart:
#         return None, "Cart not found"

#     cart_items = CartItem.query.filter_by(
#         cart_id=cart.id
#     ).all()

#     if not cart_items:
#         return None, "Cart is empty"

#     # -----------------------------------------------------
#     # Validate products and stock
#     # -----------------------------------------------------

#     for cart_item in cart_items:

#         product = db.session.get(
#             Product,
#             cart_item.product_id
#         )

#         if not product:
#             return None, (
#                 f"Product {cart_item.product_id} not found"
#             )

#         if not product.is_active:
#             return None, (
#                 f"Product '{product.name}' is not available"
#             )

#         if product.stock_quantity < cart_item.quantity:
#             return None, (
#                 f"Insufficient stock for '{product.name}'"
#             )

#     # -----------------------------------------------------
#     # Build order items
#     # -----------------------------------------------------

#     order_items_data = []

#     subtotal = Decimal("0.00")

#     for cart_item in cart_items:

#         product = db.session.get(
#             Product,
#             cart_item.product_id
#         )

#         # -------------------------------------------------
#         # Default to current product price
#         # -------------------------------------------------

#         unit_price = decimal_value(
#             product.price
#         )

#         # -------------------------------------------------
#         # If checkout supplied final item pricing,
#         # use it instead of applying promotion again.
#         # -------------------------------------------------

#         if items:

#             matching_item = next(
#                 (
#                     item
#                     for item in items
#                     if int(item.get("product_id", 0))
#                     == product.id
#                 ),
#                 None
#             )

#             if matching_item:

#                 if matching_item.get(
#                     "final_price"
#                 ) is not None:

#                     unit_price = decimal_value(
#                         matching_item.get("final_price")
#                     )

#                 elif matching_item.get(
#                     "price"
#                 ) is not None:

#                     unit_price = decimal_value(
#                         matching_item.get("price")
#                     )

#         if unit_price < 0:
#             return None, (
#                 f"Invalid price for '{product.name}'"
#             )

#         item_subtotal = (
#             unit_price
#             * cart_item.quantity
#         )

#         subtotal += item_subtotal

#         order_items_data.append({
#             "product_id": product.id,
#             "product_name": product.name,
#             "quantity": cart_item.quantity,
#             "unit_price": unit_price,
#             "subtotal": item_subtotal
#         })

#     # -----------------------------------------------------
#     # Delivery charge
#     # -----------------------------------------------------

#     delivery_charge = decimal_value(
#         delivery_charge
#     )

#     if delivery_charge < 0:
#         delivery_charge = Decimal("0.00")

#     # -----------------------------------------------------
#     # Discount
#     # -----------------------------------------------------

#     discount = decimal_value(discount)

#     if discount < 0:
#         discount = Decimal("0.00")

#     # Never allow discount greater than subtotal
#     if discount > subtotal:
#         discount = subtotal

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
#     # Create order
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

#         payment_status="pending",

#         order_status="pending",

#         notes=notes
#     )

#     db.session.add(order)

#     # Flush to get order.id
#     db.session.flush()

#     # -----------------------------------------------------
#     # Create order items
#     # -----------------------------------------------------

#     for item_data in order_items_data:

#         order_item = OrderItem(
#             order_id=order.id,

#             product_id=item_data["product_id"],

#             product_name=item_data["product_name"],

#             quantity=item_data["quantity"],

#             unit_price=item_data["unit_price"],

#             subtotal=item_data["subtotal"]
#         )

#         db.session.add(order_item)

#     # -----------------------------------------------------
#     # Reduce stock
#     # -----------------------------------------------------

#     for cart_item in cart_items:

#         product = db.session.get(
#             Product,
#             cart_item.product_id
#         )

#         product.stock_quantity -= (
#             cart_item.quantity
#         )

#     # -----------------------------------------------------
#     # Clear cart
#     # -----------------------------------------------------

#     for cart_item in cart_items:

#         db.session.delete(cart_item)

#     # -----------------------------------------------------
#     # Commit
#     # -----------------------------------------------------

#     try:
#         db.session.commit()

#     except Exception as e:

#         db.session.rollback()

#         return None, str(e)

#     return order, None


# # =========================================================
# # GET ALL USER ORDERS
# # =========================================================

# def get_user_orders(user_id):
#     """
#     Get all orders belonging to a user.
#     """

#     return Order.query.filter_by(
#         user_id=user_id
#     ).order_by(
#         Order.created_at.desc()
#     ).all()


# # =========================================================
# # GET SINGLE USER ORDER
# # =========================================================

# def get_user_order(user_id, order_id):
#     """
#     Get one order belonging to a user.
#     """

#     return Order.query.filter_by(
#         id=order_id,
#         user_id=user_id
#     ).first()


# # =========================================================
# # GET ORDER ITEMS
# # =========================================================

# def get_order_items(order_id):
#     """
#     Get all items for an order.
#     """

#     return OrderItem.query.filter_by(
#         order_id=order_id
#     ).all()


# # =========================================================
# # CANCEL ORDER
# # =========================================================

# def cancel_order(user_id, order_id):
#     """
#     Cancel a user's order and restore product stock.
#     """

#     order = Order.query.filter_by(
#         id=order_id,
#         user_id=user_id
#     ).first()

#     if not order:
#         return None, "Order not found"

#     current_status = str(
#         order.order_status or ""
#     ).lower()

#     if current_status == "cancelled":
#         return None, "Order is already cancelled"

#     if current_status in [
#         "completed",
#         "delivered"
#     ]:
#         return None, (
#             "Completed orders cannot be cancelled"
#         )

#     order_items = OrderItem.query.filter_by(
#         order_id=order.id
#     ).all()

#     # -----------------------------------------------------
#     # Restore stock
#     # -----------------------------------------------------

#     for item in order_items:

#         if not item.product_id:
#             continue

#         product = db.session.get(
#             Product,
#             item.product_id
#         )

#         if product:
#             product.stock_quantity += (
#                 item.quantity
#             )

#     # -----------------------------------------------------
#     # Update order
#     # -----------------------------------------------------

#     order.order_status = "cancelled"
#     order.updated_at = datetime.utcnow()

#     try:
#         db.session.commit()

#     except Exception as e:

#         db.session.rollback()

#         return None, str(e)

#     return order, None


# # =========================================================
# # UPDATE ORDER STATUS
# # =========================================================

# def update_order_status(order_id, new_status):
#     """
#     Update order status.

#     Intended for admin/staff usage.
#     """

#     allowed_statuses = [
#         "pending",
#         "confirmed",
#         "processing",
#         "shipped",
#         "delivered",
#         "completed",
#         "cancelled"
#     ]

#     new_status = str(
#         new_status or ""
#     ).lower().strip()

#     if new_status not in allowed_statuses:
#         return None, (
#             "Invalid order status"
#         )

#     order = db.session.get(
#         Order,
#         order_id
#     )

#     if not order:
#         return None, "Order not found"

#     # -----------------------------------------------------
#     # If cancelling, restore stock only once
#     # -----------------------------------------------------

#     old_status = str(
#         order.order_status or ""
#     ).lower()

#     if (
#         new_status == "cancelled"
#         and old_status != "cancelled"
#     ):

#         order_items = OrderItem.query.filter_by(
#             order_id=order.id
#         ).all()

#         for item in order_items:

#             if not item.product_id:
#                 continue

#             product = db.session.get(
#                 Product,
#                 item.product_id
#             )

#             if product:
#                 product.stock_quantity += (
#                     item.quantity
#                 )

#     order.order_status = new_status
#     order.updated_at = datetime.utcnow()

#     try:
#         db.session.commit()

#     except Exception as e:

#         db.session.rollback()

#         return None, str(e)

#     return order, None


# # =========================================================
# # GET ALL ORDERS - ADMIN
# # =========================================================

# def get_all_orders():
#     """
#     Get all orders for admin.
#     """

#     return Order.query.order_by(
#         Order.created_at.desc()
#     ).all()


# # =========================================================
# # GET ORDER BY ID - ADMIN
# # =========================================================

# def get_order_by_id(order_id):
#     """
#     Get any order by ID.
#     """

#     return db.session.get(
#         Order,
#         order_id
#     )


# # =========================================================
# # ORDER TOTAL SUMMARY
# # =========================================================

# def calculate_order_summary(order):
#     """
#     Return order pricing summary.
#     """

#     subtotal = decimal_value(
#         order.subtotal
#     )

#     delivery_charge = decimal_value(
#         order.delivery_charge
#     )

#     discount = decimal_value(
#         order.discount
#     )

#     total = (
#         subtotal
#         + delivery_charge
#         - discount
#     )

#     if total < 0:
#         total = Decimal("0.00")

#     return {
#         "subtotal": float(subtotal),
#         "delivery_charge": float(
#             delivery_charge
#         ),
#         "discount": float(discount),
#         "total": float(total)
#     }

from extensions import db
from models.order import Order, utc_now_naive, utc_timestamp_iso
from models.order_item import OrderItem
from models.cart import Cart
from models.cart_item import CartItem
from models.product import Product
from models.address import Address

from datetime import datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import random

from services.promotion_service import (
    calculate_discount,
    get_product_promotion
)
from services.promo_code_service import (
    calculate_promo_discount,
    record_promo_code_usage,
    validate_promo_code
)


CENT = Decimal("0.01")


def money_decimal(value):
    try:
        return Decimal(
            str(value if value is not None else 0)
        ).quantize(CENT, rounding=ROUND_HALF_UP)
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError("Invalid monetary value")


# =========================================================
# GENERATE UNIQUE ORDER NUMBER
# =========================================================

def generate_order_number():

    while True:
        date_part = datetime.utcnow().strftime("%Y%m%d")
        random_part = random.randint(1000, 9999)

        order_number = f"CT-{date_part}-{random_part}"

        existing = Order.query.filter_by(
            order_number=order_number
        ).first()

        if not existing:
            return order_number


# =========================================================
# ORDER TO DICT
# =========================================================

def order_to_dict(order):

    items = []

    for item in order.items:
        image_url = None
        product = item.product

        if product:
            image_url = product.image_url
            product_images = product.images or []
            primary_image = next(
                (
                    image
                    for image in product_images
                    if image.is_primary
                ),
                None
            )

            if primary_image:
                image_url = primary_image.image_url
            elif product_images:
                image_url = product_images[0].image_url

        items.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product_name,
            "image_url": image_url,
            "quantity": item.quantity,
            "unit_price": float(item.unit_price),
            "subtotal": float(item.subtotal)
        })

    return {
        "id": order.id,
        "order_number": order.order_number,
        "user_id": order.user_id,
        "address_id": order.address_id,

        "subtotal": float(order.subtotal or 0),
        "delivery_charge": float(order.delivery_charge or 0),
        "promotion_discount": float(order.promotion_discount or 0),
        "promo_code_id": order.promo_code_id,
        "promo_code_discount": float(order.promo_code_discount or 0),
        "discount": float(order.discount or 0),
        "total": float(order.total or 0),

        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "order_status": order.order_status,

        "notes": order.notes,

        "items": items,

        "created_at": (
            utc_timestamp_iso(order.created_at)
        ),

        "updated_at": (
            utc_timestamp_iso(order.updated_at)
        )
    }


# =========================================================
# CREATE ORDER
# =========================================================

def create_order(
    user_id,
    address_id,
    payment_method="COD",
    notes=None,
    promo_code=None
):
    def fail(message):
        db.session.rollback()
        return None, message

    try:
        address = Address.query.filter_by(
            id=address_id,
            user_id=user_id
        ).first()

        if not address:
            return fail("Address not found")

        allowed_payment_methods = [
            "COD",
            "CARD",
            "UPI",
            "STRIPE"
        ]

        if not isinstance(payment_method, str):
            return fail("Invalid payment method")

        payment_method = payment_method.strip().upper()

        if payment_method not in allowed_payment_methods:
            return fail("Invalid payment method")

        cart = Cart.query.filter_by(
            user_id=user_id
        ).with_for_update().first()

        if not cart:
            return fail("Cart is empty")

        cart_items = CartItem.query.filter_by(
            cart_id=cart.id
        ).with_for_update().all()

        if not cart_items:
            return fail("Cart is empty")

        subtotal = Decimal("0.00")
        promotional_subtotal = Decimal("0.00")
        validated_items = []

        for cart_item in cart_items:
            if cart_item.quantity is None or cart_item.quantity <= 0:
                return fail("Cart contains an invalid quantity")

            product = Product.query.filter_by(
                id=cart_item.product_id,
                is_active=True
            ).with_for_update().first()

            if not product:
                return fail(
                    f"Product ID {cart_item.product_id} "
                    f"is no longer available"
                )

            if product.stock_quantity <= 0:
                return fail(f"{product.name} is out of stock")

            if cart_item.quantity > product.stock_quantity:
                return fail(
                    f"Only {product.stock_quantity} "
                    f"{product.name} available"
                )

            promotion, promotion_error = get_product_promotion(
                product.id
            )
            if promotion_error:
                return fail(promotion_error)

            pricing = calculate_discount(product, promotion)
            original_price = money_decimal(pricing["original_price"])
            discounted_unit_price = money_decimal(pricing["final_price"])
            item_subtotal = money_decimal(
                discounted_unit_price * cart_item.quantity
            )

            subtotal += money_decimal(
                original_price * cart_item.quantity
            )
            promotional_subtotal += item_subtotal

            validated_items.append({
                "cart_item": cart_item,
                "product": product,
                "unit_price": discounted_unit_price,
                "subtotal": item_subtotal
            })

        subtotal = money_decimal(subtotal)
        promotional_subtotal = money_decimal(promotional_subtotal)
        promotion_discount = money_decimal(
            subtotal - promotional_subtotal
        )
        delivery_charge = Decimal("0.00")
        promo_code_record = None
        promo_code_discount = Decimal("0.00")

        if promo_code is not None:
            if not isinstance(promo_code, str):
                return fail("Invalid promo code")

            normalized_code = promo_code.strip().upper()
            if not normalized_code:
                return fail("Promo code is required")

            promo_code_record, promo_error = validate_promo_code(
                code=normalized_code,
                user_id=user_id,
                order_amount=promotional_subtotal
            )
            if promo_error:
                return fail(promo_error)

            promo_pricing, promo_error = calculate_promo_discount(
                promo_code=promo_code_record,
                order_amount=promotional_subtotal
            )
            if promo_error:
                return fail(promo_error)

            promo_code_discount = money_decimal(
                promo_pricing["discount_amount"]
            )

        discount = money_decimal(
            promotion_discount + promo_code_discount
        )
        total = money_decimal(
            subtotal + delivery_charge - discount
        )
        if total < 0:
            total = Decimal("0.00")

        order = Order(
            order_number=generate_order_number(),
            user_id=user_id,
            address_id=address.id,
            subtotal=subtotal,
            delivery_charge=delivery_charge,
            promotion_discount=promotion_discount,
            promo_code_id=(
                promo_code_record.id
                if promo_code_record
                else None
            ),
            promo_code_discount=promo_code_discount,
            discount=discount,
            total=total,
            payment_method=payment_method,
            payment_status="pending",
            order_status="pending",
            notes=notes
        )

        db.session.add(order)
        db.session.flush()

        if promo_code_record:
            _, usage_error = record_promo_code_usage(
                promo_code=promo_code_record,
                user_id=user_id,
                order_id=order.id,
                discount_amount=promo_code_discount,
                commit=False
            )
            if usage_error:
                return fail(usage_error)

        for item_data in validated_items:
            cart_item = item_data["cart_item"]
            product = item_data["product"]

            db.session.add(OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                quantity=cart_item.quantity,
                unit_price=item_data["unit_price"],
                subtotal=item_data["subtotal"]
            ))

            product.stock_quantity -= cart_item.quantity

        for cart_item in cart_items:
            db.session.delete(cart_item)

        cart.updated_at = datetime.utcnow()

        db.session.commit()
        return order, None

    except Exception as error:
        db.session.rollback()
        return None, str(error)


# =========================================================
# GET USER ORDERS
# =========================================================

def get_user_orders(user_id):

    return Order.query.filter_by(
        user_id=user_id
    ).order_by(
        Order.created_at.desc()
    ).all()


# =========================================================
# GET SINGLE USER ORDER
# =========================================================

def get_user_order(user_id, order_id):

    return Order.query.filter_by(
        id=order_id,
        user_id=user_id
    ).first()


# =========================================================
# CANCEL ORDER
# =========================================================

def cancel_user_order(user_id, order_id):

    order = Order.query.filter_by(
        id=order_id,
        user_id=user_id
    ).first()

    if not order:
        return None, "Order not found"

    # -----------------------------------------------------
    # Check cancellation status
    # -----------------------------------------------------

    if order.order_status in [
        "delivered",
        "cancelled"
    ]:
        return None, (
            f"Order cannot be cancelled because "
            f"it is already {order.order_status}"
        )

    # -----------------------------------------------------
    # Restore stock
    # -----------------------------------------------------

    for item in order.items:

        if item.product_id:

            product = db.session.get(
                Product,
                item.product_id
            )

            if product:
                product.stock_quantity += item.quantity

    # -----------------------------------------------------
    # Cancel order
    # -----------------------------------------------------

    order.order_status = "cancelled"
    order.updated_at = utc_now_naive()

    db.session.commit()

    return order, None


# =========================================================
# UPDATE ORDER STATUS
# =========================================================

def update_order_status(
    order_id,
    new_status
):

    order = Order.query.filter_by(
        id=order_id,
    ).first()

    if not order:
        return None, "Order not found"

    if not new_status:
        return None, "order_status is required"

    new_status = new_status.strip().lower()

    allowed_statuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled"
    ]

    if new_status not in allowed_statuses:
        return None, "Invalid order status"

    order.order_status = new_status
    order.updated_at = utc_now_naive()

    db.session.commit()

    return order, None