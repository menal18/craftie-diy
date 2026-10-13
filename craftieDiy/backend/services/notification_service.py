from extensions import db
from models.notification import Notification
from models.user import User
from sqlalchemy.exc import IntegrityError


def _notification_for_key(user_id, idempotency_key):
    if not idempotency_key:
        return None
    return Notification.query.filter_by(
        user_id=user_id,
        idempotency_key=idempotency_key
    ).first()


def _matches_notification(notification, title, message, notification_type, reference_id):
    return (
        notification.title == title.strip()
        and notification.message == message.strip()
        and notification.notification_type == (notification_type or "general")
        and notification.reference_id == reference_id
    )


# =========================================================
# CREATE NOTIFICATION
# =========================================================

def create_notification(
    user_id,
    title,
    message,
    notification_type="general",
    reference_id=None,
    idempotency_key=None
):
    """
    Create a notification for a user.
    """

    # -----------------------------------------------------
    # Validate user
    # -----------------------------------------------------

    user = db.session.get(
        User,
        user_id
    )

    if not user:
        return None, "User not found"

    # -----------------------------------------------------
    # Validate title
    # -----------------------------------------------------

    if not isinstance(title, str) or not title:
        return None, "Notification title is required"

    title = title.strip()

    if not title:
        return None, "Notification title is required"

    # -----------------------------------------------------
    # Validate message
    # -----------------------------------------------------

    if not isinstance(message, str) or not message:
        return None, "Notification message is required"

    message = message.strip()

    if not message:
        return None, "Notification message is required"

    if idempotency_key:
        existing = _notification_for_key(user_id, idempotency_key)
        if existing:
            if not _matches_notification(
                existing, title, message, notification_type, reference_id
            ):
                return None, "Idempotency key was already used with different notification data"
            return existing, None

    # -----------------------------------------------------
    # Create notification
    # -----------------------------------------------------

    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type or "general",
        reference_id=reference_id,
        is_read=False,
        idempotency_key=idempotency_key,
        email_status="pending" if idempotency_key else None
    )

    db.session.add(notification)

    try:
        db.session.commit()

    except IntegrityError:
        db.session.rollback()
        existing = _notification_for_key(user_id, idempotency_key)
        if existing and _matches_notification(
            existing, title, message, notification_type, reference_id
        ):
            return existing, None
        return None, "Unable to save notification"
    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return notification, None


# =========================================================
# GET USER NOTIFICATIONS
# =========================================================

def get_user_notifications(
    user_id,
    unread_only=False
):
    """
    Get notifications belonging to the logged-in user.

    unread_only=True returns only unread notifications.
    """

    query = Notification.query.filter_by(
        user_id=user_id
    )

    if unread_only:
        query = query.filter_by(
            is_read=False
        )

    return query.order_by(
        Notification.created_at.desc()
    ).all()


# =========================================================
# GET SINGLE NOTIFICATION
# =========================================================

def get_notification_by_id(
    user_id,
    notification_id
):
    """
    Get one notification belonging to the user.
    """

    return Notification.query.filter_by(
        id=notification_id,
        user_id=user_id
    ).first()


# =========================================================
# MARK NOTIFICATION AS READ
# =========================================================

def mark_notification_as_read(
    user_id,
    notification_id
):
    """
    Mark one notification as read.
    """

    notification = get_notification_by_id(
        user_id,
        notification_id
    )

    if not notification:
        return None, "Notification not found"

    notification.is_read = True

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return notification, None


# =========================================================
# MARK ALL NOTIFICATIONS AS READ
# =========================================================

def mark_all_notifications_as_read(user_id):
    """
    Mark all unread notifications of a user as read.
    """

    notifications = Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).all()

    for notification in notifications:
        notification.is_read = True

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return True, None


# =========================================================
# DELETE NOTIFICATION
# =========================================================

def delete_notification(
    user_id,
    notification_id
):
    """
    Delete one notification belonging to the user.
    """

    notification = get_notification_by_id(
        user_id,
        notification_id
    )

    if not notification:
        return None, "Notification not found"

    db.session.delete(notification)

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return True, None


# =========================================================
# DELETE ALL NOTIFICATIONS
# =========================================================

def delete_all_notifications(user_id):
    """
    Delete all notifications belonging to the user.
    """

    Notification.query.filter_by(
        user_id=user_id
    ).delete()

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return True, None


# =========================================================
# GET UNREAD NOTIFICATION COUNT
# =========================================================

def get_unread_notification_count(user_id):
    """
    Get number of unread notifications for a user.
    """

    count = Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).count()

    return count


# =========================================================
# GET TOTAL NOTIFICATION COUNT
# =========================================================

def get_notification_count(user_id):
    """
    Get total number of notifications for a user.
    """

    count = Notification.query.filter_by(
        user_id=user_id
    ).count()

    return count


# =========================================================
# CREATE ORDER NOTIFICATION
# =========================================================

def create_order_notification(
    user_id,
    order_id,
    title,
    message
):
    """
    Create an order-related notification.
    """

    return create_notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type="order",
        reference_id=order_id
    )


# =========================================================
# CREATE PAYMENT NOTIFICATION
# =========================================================

def create_payment_notification(
    user_id,
    order_id,
    title,
    message
):
    """
    Create a payment-related notification.
    """

    return create_notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type="payment",
        reference_id=order_id
    )


# =========================================================
# CREATE CUSTOM ORDER NOTIFICATION
# =========================================================

def create_custom_order_notification(
    user_id,
    custom_order_id,
    title,
    message
):
    """
    Create a custom-order-related notification.
    """

    return create_notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type="custom_order",
        reference_id=custom_order_id
    )


# =========================================================
# CREATE PROMOTION NOTIFICATION
# =========================================================

def create_promotion_notification(
    user_id,
    promotion_id,
    title,
    message
):
    """
    Create a promotion-related notification.
    """

    return create_notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type="promotion",
        reference_id=promotion_id
    )


# =========================================================
# CREATE GENERAL NOTIFICATION
# =========================================================

def create_general_notification(
    user_id,
    title,
    message,
    reference_id=None
):
    """
    Create a general notification.
    """

    return create_notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type="general",
        reference_id=reference_id
    )


# =========================================================
# ADMIN CREATE NOTIFICATION FOR ONE USER
# =========================================================

def admin_create_notification(
    user_id,
    title,
    message,
    notification_type="general",
    reference_id=None
):
    """
    Admin helper for creating a notification for a user.

    Admin authorization should be handled by the route.
    """

    return create_notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        reference_id=reference_id
    )


# =========================================================
# ADMIN CREATE NOTIFICATION FOR ALL USERS
# =========================================================

def create_notification_for_all_users(
    title,
    message,
    notification_type="general",
    reference_id=None,
    idempotency_key=None
):
    """
    Create the same notification for all users.
    """

    users = User.query.filter(
        db.func.lower(User.role) == "customer"
    ).all()

    if not users:
        return [], None

    notifications = []

    for user in users:
        existing = _notification_for_key(user.id, idempotency_key)
        if existing:
            if not _matches_notification(
                existing, title, message, notification_type, reference_id
            ):
                return None, "Idempotency key was already used with different notification data"
            notifications.append(existing)
            continue

        notification = Notification(
            user_id=user.id,
            title=title.strip(),
            message=message.strip(),
            notification_type=notification_type or "general",
            reference_id=reference_id,
            is_read=False,
            idempotency_key=idempotency_key,
            email_status="pending" if idempotency_key else None
        )

        db.session.add(notification)
        notifications.append(notification)

    try:
        db.session.commit()

    except IntegrityError:
        db.session.rollback()
        return None, "Notification request is already being processed; retry with the same idempotency key"
    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return notifications, None