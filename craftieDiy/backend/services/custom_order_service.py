from extensions import db
from models.custom_order import CustomOrder
from models.product import Product
from datetime import datetime
from decimal import Decimal


# =========================================================
# CUSTOMER FUNCTIONS
# =========================================================

def create_custom_order(
    user_id,
    title,
    description,
    customization_details=None,
    reference_image_url=None,
    quantity=1,
    product_id=None
):
    """
    Create a new custom order request.
    """

    # -----------------------------------------------------
    # Validate title
    # -----------------------------------------------------

    if not title:
        return None, "Custom order title is required"

    title = title.strip()

    if not title:
        return None, "Custom order title is required"

    # -----------------------------------------------------
    # Validate description
    # -----------------------------------------------------

    if not description:
        return None, "Description is required"

    description = description.strip()

    if not description:
        return None, "Description is required"

    # -----------------------------------------------------
    # Validate quantity
    # -----------------------------------------------------

    try:
        quantity = int(quantity)
    except (ValueError, TypeError):
        return None, "Invalid quantity"

    if quantity <= 0:
        return None, "Quantity must be greater than 0"

    # -----------------------------------------------------
    # Validate product if provided
    # -----------------------------------------------------

    if product_id is not None:

        product = db.session.get(
            Product,
            product_id
        )

        if not product:
            return None, "Product not found"

        if not product.is_active:
            return None, "Product is not available"

    # -----------------------------------------------------
    # Create custom order
    # -----------------------------------------------------

    custom_order = CustomOrder(
        user_id=user_id,
        product_id=product_id,
        title=title,
        description=description,
        customization_details=customization_details,
        reference_image_url=reference_image_url,
        quantity=quantity,
        status="pending"
    )

    db.session.add(custom_order)

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return custom_order, None


# =========================================================
# GET USER CUSTOM ORDERS
# =========================================================

def get_user_custom_orders(user_id):
    """
    Get all custom orders created by the logged-in user.
    """

    return CustomOrder.query.filter_by(
        user_id=user_id
    ).order_by(
        CustomOrder.created_at.desc()
    ).all()


# =========================================================
# GET USER CUSTOM ORDER BY ID
# =========================================================

def get_user_custom_order(
    user_id,
    custom_order_id
):
    """
    Get a specific custom order belonging to the user.
    """

    return CustomOrder.query.filter_by(
        id=custom_order_id,
        user_id=user_id
    ).first()


# =========================================================
# GET CUSTOM ORDER BY ID
# =========================================================

def get_custom_order_by_id(custom_order_id):
    """
    Get custom order by ID.
    """

    return db.session.get(
        CustomOrder,
        custom_order_id
    )


# =========================================================
# UPDATE CUSTOMER CUSTOM ORDER
# =========================================================

def update_custom_order(
    user_id,
    custom_order_id,
    title=None,
    description=None,
    customization_details=None,
    reference_image_url=None,
    quantity=None
):
    """
    Customer can update their custom order.

    Updates are allowed only while the request is pending.
    """

    custom_order = get_user_custom_order(
        user_id,
        custom_order_id
    )

    if not custom_order:
        return None, "Custom order not found"

    # -----------------------------------------------------
    # Check status
    # -----------------------------------------------------

    if custom_order.status not in [
        "pending"
    ]:
        return None, (
            "This custom order can no longer be edited"
        )

    # -----------------------------------------------------
    # Title
    # -----------------------------------------------------

    if title is not None:

        title = title.strip()

        if not title:
            return None, (
                "Custom order title cannot be empty"
            )

        custom_order.title = title

    # -----------------------------------------------------
    # Description
    # -----------------------------------------------------

    if description is not None:

        description = description.strip()

        if not description:
            return None, (
                "Description cannot be empty"
            )

        custom_order.description = description

    # -----------------------------------------------------
    # Customization details
    # -----------------------------------------------------

    if customization_details is not None:
        custom_order.customization_details = (
            customization_details
        )

    # -----------------------------------------------------
    # Reference image
    # -----------------------------------------------------

    if reference_image_url is not None:
        custom_order.reference_image_url = (
            reference_image_url
        )

    # -----------------------------------------------------
    # Quantity
    # -----------------------------------------------------

    if quantity is not None:

        try:
            quantity = int(quantity)
        except (ValueError, TypeError):
            return None, "Invalid quantity"

        if quantity <= 0:
            return None, (
                "Quantity must be greater than 0"
            )

        custom_order.quantity = quantity

    custom_order.updated_at = datetime.utcnow()

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return custom_order, None


# =========================================================
# CANCEL CUSTOMER CUSTOM ORDER
# =========================================================

def cancel_custom_order(
    user_id,
    custom_order_id
):
    """
    Customer cancels their custom order.

    Cancellation is allowed while the order is pending
    or quoted.
    """

    custom_order = get_user_custom_order(
        user_id,
        custom_order_id
    )

    if not custom_order:
        return None, "Custom order not found"

    if custom_order.status not in [
        "pending",
        "quoted"
    ]:
        return None, (
            "This custom order cannot be cancelled"
        )

    custom_order.status = "cancelled"
    custom_order.updated_at = datetime.utcnow()

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return custom_order, None


# =========================================================
# ACCEPT QUOTATION
# =========================================================

def accept_custom_order(
    user_id,
    custom_order_id
):
    """
    Customer accepts an admin quotation.

    Only quoted custom orders can be accepted.
    """

    custom_order = get_user_custom_order(
        user_id,
        custom_order_id
    )

    if not custom_order:
        return None, "Custom order not found"

    if custom_order.status != "quoted":
        return None, (
            "Only quoted custom orders can be accepted"
        )

    custom_order.status = "accepted"
    custom_order.updated_at = datetime.utcnow()

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return custom_order, None


# =========================================================
# ADMIN FUNCTIONS
# =========================================================

def get_all_custom_orders():
    """
    Get all custom order requests.

    Intended for admin/staff use.
    """

    return CustomOrder.query.order_by(
        CustomOrder.created_at.desc()
    ).all()


# =========================================================
# ADMIN GET SINGLE CUSTOM ORDER
# =========================================================

def admin_get_custom_order(custom_order_id):
    """
    Get any custom order by ID.

    Intended for admin/staff use.
    """

    custom_order = db.session.get(
        CustomOrder,
        custom_order_id
    )

    if not custom_order:
        return None, "Custom order not found"

    return custom_order, None


# =========================================================
# ADMIN UPDATE CUSTOM ORDER
# =========================================================

def admin_update_custom_order(
    custom_order_id,
    status=None,
    estimated_price=None,
    admin_notes=None
):
    """
    Admin updates custom order quotation/status.
    """

    custom_order = db.session.get(
        CustomOrder,
        custom_order_id
    )

    if not custom_order:
        return None, "Custom order not found"

    # -----------------------------------------------------
    # Status
    # -----------------------------------------------------

    if status is not None:

        status = str(
            status
        ).lower().strip()

        allowed_statuses = [
            "pending",
            "quoted",
            "accepted",
            "rejected",
            "in_progress",
            "completed",
            "cancelled"
        ]

        if status not in allowed_statuses:
            return None, (
                "Invalid custom order status"
            )

        custom_order.status = status

    # -----------------------------------------------------
    # Estimated price
    # -----------------------------------------------------

    if estimated_price is not None:

        try:
            estimated_price = Decimal(
                str(estimated_price)
            )
        except (ValueError, TypeError):
            return None, (
                "Invalid estimated price"
            )

        if estimated_price < 0:
            return None, (
                "Estimated price cannot be negative"
            )

        custom_order.estimated_price = (
            estimated_price
        )

    # -----------------------------------------------------
    # Admin notes
    # -----------------------------------------------------

    if admin_notes is not None:
        custom_order.admin_notes = admin_notes

    custom_order.updated_at = datetime.utcnow()

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return custom_order, None


# =========================================================
# ADMIN REJECT CUSTOM ORDER
# =========================================================

def admin_reject_custom_order(
    custom_order_id,
    admin_notes=None
):
    """
    Admin rejects a custom order.
    """

    custom_order = db.session.get(
        CustomOrder,
        custom_order_id
    )

    if not custom_order:
        return None, "Custom order not found"

    if custom_order.status in [
        "completed",
        "cancelled"
    ]:
        return None, (
            "This custom order cannot be rejected"
        )

    custom_order.status = "rejected"

    if admin_notes is not None:
        custom_order.admin_notes = admin_notes

    custom_order.updated_at = datetime.utcnow()

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return custom_order, None


# =========================================================
# ADMIN CANCEL CUSTOM ORDER
# =========================================================

def admin_cancel_custom_order(
    custom_order_id,
    admin_notes=None
):
    """
    Admin cancels a custom order.
    """

    custom_order = db.session.get(
        CustomOrder,
        custom_order_id
    )

    if not custom_order:
        return None, "Custom order not found"

    if custom_order.status == "completed":
        return None, (
            "Completed custom orders cannot be cancelled"
        )

    custom_order.status = "cancelled"

    if admin_notes is not None:
        custom_order.admin_notes = admin_notes

    custom_order.updated_at = datetime.utcnow()

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return custom_order, None


# =========================================================
# ADMIN SET QUOTATION
# =========================================================

def set_custom_order_quote(
    custom_order_id,
    estimated_price,
    admin_notes=None
):
    """
    Admin gives a price quotation to the customer.
    """

    custom_order = db.session.get(
        CustomOrder,
        custom_order_id
    )

    if not custom_order:
        return None, "Custom order not found"

    # -----------------------------------------------------
    # Validate price
    # -----------------------------------------------------

    try:
        estimated_price = Decimal(
            str(estimated_price)
        )
    except (ValueError, TypeError):
        return None, (
            "Invalid estimated price"
        )

    if estimated_price < 0:
        return None, (
            "Estimated price cannot be negative"
        )

    # -----------------------------------------------------
    # Check current status
    # -----------------------------------------------------

    if custom_order.status in [
        "cancelled",
        "rejected",
        "completed"
    ]:
        return None, (
            "Quotation cannot be created for this order"
        )

    custom_order.estimated_price = (
        estimated_price
    )

    custom_order.status = "quoted"

    if admin_notes is not None:
        custom_order.admin_notes = admin_notes

    custom_order.updated_at = datetime.utcnow()

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return custom_order, None


# =========================================================
# UPDATE CUSTOM ORDER STATUS
# =========================================================

def update_custom_order_status(
    custom_order_id,
    status
):
    """
    Update custom order status.

    Intended for admin/staff use.
    """

    custom_order = db.session.get(
        CustomOrder,
        custom_order_id
    )

    if not custom_order:
        return None, "Custom order not found"

    status = str(
        status
    ).lower().strip()

    allowed_statuses = [
        "pending",
        "quoted",
        "accepted",
        "rejected",
        "in_progress",
        "completed",
        "cancelled"
    ]

    if status not in allowed_statuses:
        return None, (
            "Invalid custom order status"
        )

    custom_order.status = status
    custom_order.updated_at = datetime.utcnow()

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return custom_order, None


# =========================================================
# GET CUSTOM ORDERS BY STATUS
# =========================================================

def get_custom_orders_by_status(status):
    """
    Get custom orders filtered by status.
    """

    status = str(
        status
    ).lower().strip()

    return CustomOrder.query.filter_by(
        status=status
    ).order_by(
        CustomOrder.created_at.desc()
    ).all()


# =========================================================
# GET CUSTOM ORDER COUNT
# =========================================================

def get_custom_order_count(status=None):
    """
    Get total custom order count.

    If status is provided, return count for that status.
    """

    query = CustomOrder.query

    if status:
        query = query.filter_by(
            status=str(status).lower().strip()
        )

    return query.count()