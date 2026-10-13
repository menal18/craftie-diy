from extensions import db

from models.user import User
from models.category import Category
from models.product import Product
from models.order import Order
from models.custom_order import CustomOrder
from models.payment import Payment


# =========================================================
# DASHBOARD STATISTICS
# =========================================================

def get_dashboard_stats():
    """
    Get overall statistics for the admin dashboard.
    """

    # -----------------------------------------------------
    # User counts
    # -----------------------------------------------------

    total_users = User.query.count()

    total_customers = User.query.filter_by(
        role="customer"
    ).count()

    # -----------------------------------------------------
    # Product / category counts
    # -----------------------------------------------------

    total_products = Product.query.count()

    active_products = Product.query.filter_by(
        is_active=True
    ).count()

    total_categories = Category.query.count()

    active_categories = Category.query.filter_by(
        is_active=True
    ).count()

    # -----------------------------------------------------
    # Order counts
    # -----------------------------------------------------

    total_orders = Order.query.count()

    pending_orders = Order.query.filter_by(
        order_status="pending"
    ).count()

    completed_orders = Order.query.filter(
        Order.order_status.in_([
            "completed",
            "delivered"
        ])
    ).count()

    cancelled_orders = Order.query.filter_by(
        order_status="cancelled"
    ).count()

    # -----------------------------------------------------
    # Custom order counts
    # -----------------------------------------------------

    total_custom_orders = CustomOrder.query.count()

    pending_custom_orders = CustomOrder.query.filter_by(
        status="pending"
    ).count()

    quoted_custom_orders = CustomOrder.query.filter_by(
        status="quoted"
    ).count()

    accepted_custom_orders = CustomOrder.query.filter_by(
        status="accepted"
    ).count()

    completed_custom_orders = CustomOrder.query.filter_by(
        status="completed"
    ).count()

    # -----------------------------------------------------
    # Payment counts
    # -----------------------------------------------------

    total_payments = Payment.query.count()

    pending_payments = Payment.query.filter_by(
        status="pending"
    ).count()

    successful_payments = Payment.query.filter(
        Payment.status.in_([
            "paid",
            "success",
            "successful"
        ])
    ).count()

    failed_payments = Payment.query.filter(
        Payment.status.in_([
            "failed",
            "cancelled"
        ])
    ).count()

    # -----------------------------------------------------
    # Revenue
    # -----------------------------------------------------

    revenue = 0

    completed_orders_list = Order.query.filter(
        Order.order_status.in_([
            "completed",
            "delivered"
        ])
    ).all()

    for order in completed_orders_list:

        if order.total is not None:
            revenue += float(order.total)

    revenue = round(revenue, 2)

    # -----------------------------------------------------
    # Return dashboard data
    # -----------------------------------------------------

    return {
        "users": {
            "total": total_users,
            "customers": total_customers
        },

        "products": {
            "total": total_products,
            "active": active_products
        },

        "categories": {
            "total": total_categories,
            "active": active_categories
        },

        "orders": {
            "total": total_orders,
            "pending": pending_orders,
            "completed": completed_orders,
            "cancelled": cancelled_orders
        },

        "custom_orders": {
            "total": total_custom_orders,
            "pending": pending_custom_orders,
            "quoted": quoted_custom_orders,
            "accepted": accepted_custom_orders,
            "completed": completed_custom_orders
        },

        "payments": {
            "total": total_payments,
            "pending": pending_payments,
            "successful": successful_payments,
            "failed": failed_payments
        },

        "revenue": revenue
    }


# =========================================================
# GET ALL USERS
# =========================================================

def get_all_users():
    """
    Get all users for admin management.
    """

    return User.query.order_by(
        User.created_at.desc()
    ).all()


# =========================================================
# GET USER BY ID
# =========================================================

def get_user_by_id(user_id):
    """
    Get a user by ID.
    """

    return db.session.get(
        User,
        user_id
    )


# =========================================================
# GET USERS BY ROLE
# =========================================================

def get_users_by_role(role):
    """
    Get users filtered by role.
    """

    if not role:
        return []

    role = str(
        role
    ).lower().strip()

    return User.query.filter_by(
        role=role
    ).order_by(
        User.created_at.desc()
    ).all()


# =========================================================
# UPDATE USER ROLE
# =========================================================

def update_user_role(
    user_id,
    role
):
    """
    Update a user's role.

    Admin authorization should be handled by the route.
    """

    user = db.session.get(
        User,
        user_id
    )

    if not user:
        return None, "User not found"

    if not role:
        return None, "Role is required"

    role = str(
        role
    ).lower().strip()

    allowed_roles = [
        "customer",
        "admin"
    ]

    if role not in allowed_roles:
        return None, "Invalid user role"

    user.role = role

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return user, None


# =========================================================
# DELETE USER
# =========================================================

def delete_user(user_id):
    """
    Delete a user.

    Use carefully because related records may also be
    deleted depending on database foreign-key settings.
    """

    user = db.session.get(
        User,
        user_id
    )

    if not user:
        return None, "User not found"

    db.session.delete(user)

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return True, None


# =========================================================
# GET ALL ORDERS
# =========================================================

def get_all_orders():
    """
    Get all orders for admin.
    """

    return Order.query.order_by(
        Order.created_at.desc()
    ).all()


# =========================================================
# GET ORDER BY ID
# =========================================================

def get_order_by_id(order_id):
    """
    Get a specific order.
    """

    return db.session.get(
        Order,
        order_id
    )


# =========================================================
# GET ORDERS BY STATUS
# =========================================================

def get_orders_by_status(status):
    """
    Get orders filtered by status.
    """

    if not status:
        return []

    status = str(
        status
    ).lower().strip()

    return Order.query.filter_by(
        order_status=status
    ).order_by(
        Order.created_at.desc()
    ).all()


# =========================================================
# GET ALL CUSTOM ORDERS
# =========================================================

def get_all_custom_orders():
    """
    Get all custom order requests.
    """

    return CustomOrder.query.order_by(
        CustomOrder.created_at.desc()
    ).all()


# =========================================================
# GET CUSTOM ORDER BY ID
# =========================================================

def get_custom_order_by_id(
    custom_order_id
):
    """
    Get a specific custom order.
    """

    return db.session.get(
        CustomOrder,
        custom_order_id
    )


# =========================================================
# GET CUSTOM ORDERS BY STATUS
# =========================================================

def get_custom_orders_by_status(
    status
):
    """
    Get custom orders filtered by status.
    """

    if not status:
        return []

    status = str(
        status
    ).lower().strip()

    return CustomOrder.query.filter_by(
        status=status
    ).order_by(
        CustomOrder.created_at.desc()
    ).all()


# =========================================================
# GET ALL PAYMENTS
# =========================================================

def get_all_payments():
    """
    Get all payment records.
    """

    return Payment.query.order_by(
        Payment.created_at.desc()
    ).all()


# =========================================================
# GET PAYMENT BY ID
# =========================================================

def get_payment_by_id(
    payment_id
):
    """
    Get a payment by ID.
    """

    return db.session.get(
        Payment,
        payment_id
    )


# =========================================================
# GET PAYMENTS BY STATUS
# =========================================================

def get_payments_by_status(
    status
):
    """
    Get payments filtered by status.
    """

    if not status:
        return []

    status = str(
        status
    ).lower().strip()

    return Payment.query.filter_by(
        status=status
    ).order_by(
        Payment.created_at.desc()
    ).all()


# =========================================================
# GET PRODUCT STOCK SUMMARY
# =========================================================

def get_product_stock_summary():
    """
    Get product stock information for admin.
    """

    products = Product.query.order_by(
        Product.stock_quantity.asc()
    ).all()

    result = []

    for product in products:

        if product.stock_quantity == 0:
            stock_status = "out_of_stock"

        elif product.stock_quantity <= 5:
            stock_status = "low_stock"

        else:
            stock_status = "in_stock"

        result.append({
            "product_id": product.id,
            "product_name": product.name,
            "stock_quantity": product.stock_quantity,
            "is_active": product.is_active,
            "stock_status": stock_status
        })

    return result


# =========================================================
# GET LOW STOCK PRODUCTS
# =========================================================

def get_low_stock_products(
    threshold=5
):
    """
    Get products whose stock is at or below the threshold.
    """

    try:
        threshold = int(threshold)
    except (ValueError, TypeError):
        threshold = 5

    if threshold < 0:
        threshold = 0

    return Product.query.filter(
        Product.stock_quantity <= threshold,
        Product.is_active == True
    ).order_by(
        Product.stock_quantity.asc()
    ).all()


# =========================================================
# GET OUT OF STOCK PRODUCTS
# =========================================================

def get_out_of_stock_products():
    """
    Get active products with zero stock.
    """

    return Product.query.filter(
        Product.stock_quantity == 0,
        Product.is_active == True
    ).order_by(
        Product.name.asc()
    ).all()


# =========================================================
# GET REVENUE
# =========================================================

def get_total_revenue():
    """
    Calculate total revenue from completed/delivered
    orders.
    """

    orders = Order.query.filter(
        Order.order_status.in_([
            "completed",
            "delivered"
        ])
    ).all()

    total_revenue = 0

    for order in orders:

        if order.total is not None:
            total_revenue += float(
                order.total
            )

    return round(
        total_revenue,
        2
    )


# =========================================================
# GET ORDER SUMMARY
# =========================================================

def get_order_summary():
    """
    Get order counts grouped by status.
    """

    statuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "completed",
        "cancelled"
    ]

    summary = {}

    for status in statuses:

        summary[status] = Order.query.filter_by(
            order_status=status
        ).count()

    return summary


# =========================================================
# GET CUSTOM ORDER SUMMARY
# =========================================================

def get_custom_order_summary():
    """
    Get custom order counts grouped by status.
    """

    statuses = [
        "pending",
        "quoted",
        "accepted",
        "rejected",
        "in_progress",
        "completed",
        "cancelled"
    ]

    summary = {}

    for status in statuses:

        summary[status] = CustomOrder.query.filter_by(
            status=status
        ).count()

    return summary


# =========================================================
# GET PAYMENT SUMMARY
# =========================================================

def get_payment_summary():
    """
    Get payment counts grouped by status.
    """

    statuses = [
        "pending",
        "paid",
        "success",
        "successful",
        "failed",
        "cancelled",
        "refunded"
    ]

    summary = {}

    for status in statuses:

        summary[status] = Payment.query.filter_by(
            status=status
        ).count()

    return summary

# =========================================================
# ADMIN REVIEW MANAGEMENT
# =========================================================

def get_all_reviews():
    """
    Get all reviews for admin.
    Newest reviews first.
    """

    from models.review import Review

    return Review.query.order_by(
        Review.created_at.desc()
    ).all()


def delete_review_by_admin(review_id):
    """
    Delete a review from admin panel.
    """

    from models.review import Review

    review = db.session.get(
        Review,
        review_id
    )

    if not review:
        return None, "Review not found"

    db.session.delete(review)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return review, None

# =========================================================
# ADMIN PROFILE
# =========================================================

from werkzeug.security import check_password_hash, generate_password_hash


def get_admin_profile(user_id):
    """
    Get admin profile by user ID.
    """

    user = db.session.get(User, user_id)

    if not user:
        return None, "User not found"

    if str(user.role).lower() != "admin":
        return None, "Admin access required"

    return user, None


def update_admin_profile(
    user_id,
    name=None,
    email=None,
    phone=None,
    current_password=None,
    new_password=None
):
    """
    Update admin profile information.

    Password changes require the current password.
    """

    user = db.session.get(User, user_id)

    if not user:
        return None, "User not found"

    if str(user.role).lower() != "admin":
        return None, "Admin access required"

    # -----------------------------------------------------
    # NAME
    # -----------------------------------------------------

    if name is not None:
        name = str(name).strip()

        if not name:
            return None, "Name is required"

        user.name = name

    # -----------------------------------------------------
    # EMAIL
    # -----------------------------------------------------

    if email is not None:
        email = str(email).strip().lower()

        if not email:
            return None, "Email is required"

        existing_user = User.query.filter(
            User.email == email,
            User.id != user.id
        ).first()

        if existing_user:
            return None, "Email already exists"

        user.email = email

    # -----------------------------------------------------
    # PHONE
    # -----------------------------------------------------

    if phone is not None:
        user.phone = str(phone).strip() or None

    # -----------------------------------------------------
    # PASSWORD
    # -----------------------------------------------------

    if new_password is not None:

        if not current_password:
            return None, "Current password is required"

        if not check_password_hash(
            user.password_hash,
            current_password
        ):
            return None, "Current password is incorrect"

        new_password = str(new_password)

        if len(new_password) < 6:
            return None, "New password must be at least 6 characters"

        user.password_hash = generate_password_hash(
            new_password
        )

    # -----------------------------------------------------
    # SAVE
    # -----------------------------------------------------

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()

        return None, str(e)

    return user, None