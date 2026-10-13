from extensions import db
from models.promo_code import PromoCode
from models.promo_code_usage import PromoCodeUsage
from models.order import Order
from datetime import datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP


_UNSET = object()


def _normalize_optional_limit(value, label):
    if value is None or value == "":
        return None, None

    try:
        limit = int(value)
    except (ValueError, TypeError):
        return None, f"Invalid {label}"

    if limit < 0:
        return None, f"{label.replace('_', ' ').capitalize()} cannot be negative"

    return (None if limit == 0 else limit), None


# =========================================================
# GET ALL PROMO CODES
# =========================================================

def get_all_promo_codes(active_only=False):
    """
    Get all promo codes.

    If active_only=True, return only currently active
    and valid promo codes.
    """

    query = PromoCode.query

    if active_only:
        now = datetime.utcnow()

        query = query.filter(
            PromoCode.is_active == True,
            PromoCode.start_date <= now,
            PromoCode.end_date >= now
        )

    return query.order_by(
        PromoCode.created_at.desc()
    ).all()


# =========================================================
# GET ACTIVE PROMO CODES
# =========================================================

def get_active_promo_codes():
    """
    Get promo codes that are currently active.
    """

    now = datetime.utcnow()

    return PromoCode.query.filter(
        PromoCode.is_active == True,
        PromoCode.start_date <= now,
        PromoCode.end_date >= now
    ).order_by(
        PromoCode.created_at.desc()
    ).all()


# =========================================================
# GET SINGLE PROMO CODE
# =========================================================

def get_promo_code_by_id(promo_code_id):
    """
    Get promo code by ID.
    """

    return db.session.get(
        PromoCode,
        promo_code_id
    )


# =========================================================
# GET PROMO CODE BY CODE
# =========================================================

def get_promo_code_by_code(code):
    """
    Find promo code using its code.
    """

    if not code:
        return None

    normalized_code = code.strip().upper()

    return PromoCode.query.filter_by(
        code=normalized_code
    ).first()


# =========================================================
# CREATE PROMO CODE
# =========================================================

def create_promo_code(
    code,
    description,
    discount_type,
    discount_value,
    minimum_order_value=0,
    maximum_discount=None,
    usage_limit=None,
    per_user_limit=None,
    start_date=None,
    end_date=None
):
    """
    Create a new promo code.
    """

    # -----------------------------------------------------
    # Validate code
    # -----------------------------------------------------

    if not code:
        return None, "Promo code is required"

    code = code.strip().upper()

    if not code:
        return None, "Promo code is required"

    existing = PromoCode.query.filter_by(
        code=code
    ).first()

    if existing:
        return None, "Promo code already exists"

    # -----------------------------------------------------
    # Validate discount type
    # -----------------------------------------------------

    if not discount_type:
        return None, "Discount type is required"

    discount_type = str(
        discount_type
    ).lower().strip()

    if discount_type not in [
        "percentage",
        "fixed"
    ]:
        return None, (
            "Discount type must be percentage or fixed"
        )

    # -----------------------------------------------------
    # Validate discount value
    # -----------------------------------------------------

    try:
        discount_value = Decimal(
            str(discount_value)
        )
    except (ValueError, TypeError):
        return None, "Invalid discount value"

    if discount_value <= 0:
        return None, (
            "Discount value must be greater than 0"
        )

    if discount_type == "percentage":

        if discount_value > 100:
            return None, (
                "Percentage discount cannot exceed 100"
            )

    # -----------------------------------------------------
    # Minimum order value
    # -----------------------------------------------------

    try:
        minimum_order_value = Decimal(
            str(minimum_order_value or 0)
        )
    except (ValueError, TypeError):
        return None, (
            "Invalid minimum order value"
        )

    if minimum_order_value < 0:
        return None, (
            "Minimum order value cannot be negative"
        )

    # -----------------------------------------------------
    # Maximum discount
    # -----------------------------------------------------

    if maximum_discount == "":
        maximum_discount = None

    if maximum_discount is not None:

        try:
            maximum_discount = Decimal(
                str(maximum_discount)
            )
        except (ValueError, TypeError):
            return None, (
                "Invalid maximum discount"
            )

        if maximum_discount < 0:
            return None, (
                "Maximum discount cannot be negative"
            )

        if maximum_discount == 0:
            maximum_discount = None

    # -----------------------------------------------------
    # Usage limit
    # -----------------------------------------------------

    usage_limit, error = _normalize_optional_limit(
        usage_limit,
        "usage_limit"
    )
    if error:
        return None, error

    per_user_limit, error = _normalize_optional_limit(
        per_user_limit,
        "per_user_limit"
    )
    if error:
        return None, error

    # -----------------------------------------------------
    # Dates
    # -----------------------------------------------------

    if not start_date:
        return None, "Start date is required"

    if not end_date:
        return None, "End date is required"

    if end_date < start_date:
        return None, (
            "End date cannot be before start date"
        )

    # -----------------------------------------------------
    # Create promo code
    # -----------------------------------------------------

    promo_code = PromoCode(
        code=code,
        description=description,
        discount_type=discount_type,
        discount_value=discount_value,
        minimum_order_value=minimum_order_value,
        maximum_discount=maximum_discount,
        usage_limit=usage_limit,
        per_user_limit=per_user_limit,
        used_count=0,
        start_date=start_date,
        end_date=end_date,
        is_active=True
    )

    db.session.add(promo_code)

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return promo_code, None


# =========================================================
# UPDATE PROMO CODE
# =========================================================

def update_promo_code(
    promo_code,
    code=None,
    description=None,
    discount_type=None,
    discount_value=None,
    minimum_order_value=None,
    maximum_discount=_UNSET,
    usage_limit=_UNSET,
    per_user_limit=_UNSET,
    start_date=None,
    end_date=None,
    is_active=None
):
    """
    Update an existing promo code.
    """

    # -----------------------------------------------------
    # Code
    # -----------------------------------------------------

    if code is not None:

        code = code.strip().upper()

        if not code:
            return None, (
                "Promo code cannot be empty"
            )

        existing = PromoCode.query.filter(
            PromoCode.code == code,
            PromoCode.id != promo_code.id
        ).first()

        if existing:
            return None, (
                "Promo code already exists"
            )

        promo_code.code = code

    # -----------------------------------------------------
    # Description
    # -----------------------------------------------------

    if description is not None:
        promo_code.description = description

    # -----------------------------------------------------
    # Discount type
    # -----------------------------------------------------

    if discount_type is not None:

        discount_type = str(
            discount_type
        ).lower().strip()

        if discount_type not in [
            "percentage",
            "fixed"
        ]:
            return None, (
                "Discount type must be percentage or fixed"
            )

        promo_code.discount_type = discount_type

    # -----------------------------------------------------
    # Discount value
    # -----------------------------------------------------

    if discount_value is not None:

        try:
            discount_value = Decimal(
                str(discount_value)
            )
        except (ValueError, TypeError):
            return None, (
                "Invalid discount value"
            )

        if discount_value <= 0:
            return None, (
                "Discount value must be greater than 0"
            )

        current_type = (
            promo_code.discount_type
        )

        if current_type == "percentage":

            if discount_value > 100:
                return None, (
                    "Percentage discount cannot exceed 100"
                )

        promo_code.discount_value = discount_value

    # -----------------------------------------------------
    # Minimum order value
    # -----------------------------------------------------

    if minimum_order_value is not None:

        if minimum_order_value == "":
            minimum_order_value = 0

        try:
            minimum_order_value = Decimal(
                str(minimum_order_value)
            )
        except (ValueError, TypeError):
            return None, (
                "Invalid minimum order value"
            )

        if minimum_order_value < 0:
            return None, (
                "Minimum order value cannot be negative"
            )

        promo_code.minimum_order_value = (
            minimum_order_value
        )

    # -----------------------------------------------------
    # Maximum discount
    # -----------------------------------------------------


    if maximum_discount is not _UNSET:

        if maximum_discount in (None, ""):
            promo_code.maximum_discount = None
        else:
            try:
                maximum_discount = Decimal(
                    str(maximum_discount)
                )
            except (ValueError, TypeError):
                return None, "Invalid maximum discount"

            if maximum_discount < 0:
                return None, (
                    "Maximum discount cannot be negative"
                )

            promo_code.maximum_discount = (
                maximum_discount
                if maximum_discount > 0
                else None
            )

        promo_code.maximum_discount = (
            maximum_discount
        )

    # -----------------------------------------------------
    # Usage limit
    # -----------------------------------------------------

    if usage_limit is not _UNSET:
        usage_limit, error = _normalize_optional_limit(
            usage_limit,
            "usage_limit"
        )
        if error:
            return None, error

        if (
            usage_limit is not None
            and usage_limit < promo_code.used_count
        ):
            return None, (
                "Usage limit cannot be less than used count"
            )

        promo_code.usage_limit = usage_limit

    if per_user_limit is not _UNSET:
        per_user_limit, error = _normalize_optional_limit(
            per_user_limit,
            "per_user_limit"
        )
        if error:
            return None, error

        promo_code.per_user_limit = per_user_limit

    # -----------------------------------------------------
    # Dates
    # -----------------------------------------------------

    if start_date is not None:
        promo_code.start_date = start_date

    if end_date is not None:
        promo_code.end_date = end_date

    if promo_code.end_date < promo_code.start_date:
        return None, (
            "End date cannot be before start date"
        )

    # -----------------------------------------------------
    # Active status
    # -----------------------------------------------------

    if is_active is not None:
        promo_code.is_active = bool(
            is_active
        )

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return promo_code, None


# =========================================================
# DELETE / DEACTIVATE PROMO CODE
# =========================================================

def delete_promo_code(promo_code):
    """
    Soft delete / deactivate promo code.
    """

    promo_code.is_active = False

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return promo_code, None


# =========================================================
# VALIDATE PROMO CODE
# =========================================================

def validate_promo_code(
    code,
    user_id,
    order_amount
):
    """
    Validate a promo code before applying it.

    Checks:
    - Code exists
    - Active status
    - Start/end date
    - Usage limit
    - Minimum order value
    - User has not already used it
    """

    # -----------------------------------------------------
    # Find code
    # -----------------------------------------------------

    promo_code = get_promo_code_by_code(
        code
    )

    if not promo_code:
        return None, (
            "Invalid promo code."
        )

    # -----------------------------------------------------
    # Active check
    # -----------------------------------------------------

    if not promo_code.is_active:
        return None, (
            "This promo code is inactive."
        )

    # -----------------------------------------------------
    # Date check
    # -----------------------------------------------------

    now = datetime.utcnow()

    if now < promo_code.start_date:
        return None, (
            "This promo code is not active yet."
        )

    if now > promo_code.end_date:
        return None, (
            "This promo code has expired."
        )

    # -----------------------------------------------------
    # Usage limit
    # -----------------------------------------------------

    if (
        promo_code.usage_limit is not None
        and promo_code.used_count
        >= promo_code.usage_limit
    ):
        return None, (
            "This promo code has reached its usage limit."
        )

    # -----------------------------------------------------
    # Order amount
    # -----------------------------------------------------

    try:
        order_amount = Decimal(
            str(order_amount)
        )
    except (ValueError, TypeError):
        return None, (
            "Invalid order amount"
        )

    if order_amount < 0:
        return None, (
            "Order amount cannot be negative"
        )

    # -----------------------------------------------------
    # Minimum order check
    # -----------------------------------------------------

    if (
        order_amount
        < promo_code.minimum_order_value
    ):
        return None, (
            "Minimum order amount of "
            f"₹{promo_code.minimum_order_value:.2f} is required."
        )

    # -----------------------------------------------------
    # Check whether user already used code
    # -----------------------------------------------------

    if user_id:

        usage_count = PromoCodeUsage.query.filter_by(
            promo_code_id=promo_code.id,
            user_id=user_id
        ).count()

        if (
            promo_code.per_user_limit is not None
            and usage_count >= promo_code.per_user_limit
        ):
            return None, (
                "You have already used this promo code."
            )

    return promo_code, None


# =========================================================
# CALCULATE PROMO DISCOUNT
# =========================================================

def calculate_promo_discount(
    promo_code,
    order_amount
):
    """
    Calculate the discount amount for a promo code.
    """

    try:
        order_amount = Decimal(
            str(order_amount)
        )
    except (ValueError, TypeError):
        return None, (
            "Invalid order amount"
        )

    if order_amount <= 0:
        return {
            "discount_amount": 0.0,
            "final_amount": 0.0
        }, None

    # -----------------------------------------------------
    # Percentage discount
    # -----------------------------------------------------

    if promo_code.discount_type == "percentage":

        discount_amount = (
            order_amount
            * Decimal(
                str(promo_code.discount_value)
            )
            / Decimal("100")
        )

    # -----------------------------------------------------
    # Fixed discount
    # -----------------------------------------------------

    else:

        discount_amount = Decimal(
            str(promo_code.discount_value)
        )

    # -----------------------------------------------------
    # Maximum discount limit
    # -----------------------------------------------------

    if promo_code.maximum_discount is not None:

        maximum_discount = Decimal(
            str(promo_code.maximum_discount)
        )

        if discount_amount > maximum_discount:
            discount_amount = maximum_discount

    # -----------------------------------------------------
    # Discount cannot exceed order amount
    # -----------------------------------------------------

    if discount_amount > order_amount:
        discount_amount = order_amount

    discount_amount = discount_amount.quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )
    order_amount = order_amount.quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )
    final_amount = order_amount - discount_amount

    return {
        "order_amount": float(
            order_amount
        ),
        "discount_amount": float(discount_amount),
        "final_amount": float(final_amount)
    }, None


# =========================================================
# APPLY / RECORD PROMO CODE USAGE
# =========================================================

def record_promo_code_usage(
    promo_code,
    user_id,
    order_id,
    discount_amount,
    commit=True
):
    """
    Record successful promo code usage.

    This should be called only after the order is
    successfully created.
    """

    if not promo_code:
        return None, (
            "Promo code is required"
        )

    try:
        order = db.session.get(Order, order_id)
        if not order:
            return None, "Order not found"

        if order.user_id != user_id:
            return None, "Order does not belong to this user"

        if order.promo_code_id != promo_code.id:
            return None, "Promo code does not match the order"

        locked_promo_code = PromoCode.query.filter_by(
            id=promo_code.id
        ).with_for_update().populate_existing().first()

        if not locked_promo_code:
            return None, "Promo code not found"

        now = datetime.utcnow()
        if not locked_promo_code.is_active:
            return None, "This promo code is inactive."
        if now < locked_promo_code.start_date:
            return None, "This promo code is not active yet."
        if now > locked_promo_code.end_date:
            return None, "This promo code has expired."

        discount_amount = Decimal(
            str(discount_amount)
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        order_promo_discount = Decimal(
            str(order.promo_code_discount or 0)
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        promotional_subtotal = (
            Decimal(str(order.subtotal or 0))
            - Decimal(str(order.promotion_discount or 0))
        )

        if (
            not discount_amount.is_finite()
            or not order_promo_discount.is_finite()
            or promotional_subtotal < 0
            or discount_amount < 0
        ):
            return None, "Invalid discount amount"

        expected_discount, calculation_error = calculate_promo_discount(
            promo_code=locked_promo_code,
            order_amount=promotional_subtotal
        )
        if calculation_error:
            return None, calculation_error

        expected_discount_amount = Decimal(
            str(expected_discount["discount_amount"])
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        if (
            discount_amount != order_promo_discount
            or discount_amount != expected_discount_amount
            or discount_amount > promotional_subtotal
        ):
            return None, "Discount amount does not match the order"

        existing_usages = PromoCodeUsage.query.filter_by(
            promo_code_id=locked_promo_code.id,
            user_id=user_id
        ).with_for_update().all()

        if (
            locked_promo_code.per_user_limit is not None
            and len(existing_usages)
            >= locked_promo_code.per_user_limit
        ):
            return None, (
                "You have already used this promo code."
            )

        if (
            locked_promo_code.usage_limit is not None
            and locked_promo_code.used_count
            >= locked_promo_code.usage_limit
        ):
            return None, (
                "This promo code has reached its usage limit."
            )

        if promotional_subtotal < Decimal(
            str(locked_promo_code.minimum_order_value)
        ):
            return None, (
                "Minimum order amount of "
                f"₹{locked_promo_code.minimum_order_value:.2f} is required."
            )

        usage = PromoCodeUsage(
            promo_code_id=locked_promo_code.id,
            user_id=user_id,
            order_id=order.id,
            discount_amount=discount_amount,
            used_at=datetime.utcnow()
        )

        db.session.add(usage)
        locked_promo_code.used_count += 1

        if commit:
            db.session.commit()

        return usage, None

    except (InvalidOperation, TypeError, ValueError):
        return None, "Invalid discount amount"
    except Exception as error:
        db.session.rollback()
        return None, str(error)


# =========================================================
# GET USER PROMO CODE USAGE
# =========================================================

def get_user_promo_code_usage(user_id):
    """
    Get all promo codes used by a user.
    """

    return PromoCodeUsage.query.filter_by(
        user_id=user_id
    ).order_by(
        PromoCodeUsage.used_at.desc()
    ).all()


# =========================================================
# CHECK USER USED PROMO CODE
# =========================================================

def has_user_used_promo_code(
    user_id,
    promo_code_id
):
    """
    Check whether a user has already used a promo code.
    """

    usage = PromoCodeUsage.query.filter_by(
        user_id=user_id,
        promo_code_id=promo_code_id
    ).first()

    return usage is not None


# =========================================================
# GET PROMO CODE DISCOUNT PREVIEW
# =========================================================

def get_promo_code_preview(
    code,
    user_id,
    order_amount
):
    """
    Validate a promo code and calculate its discount
    without recording usage.
    """

    promo_code, error = validate_promo_code(
        code,
        user_id,
        order_amount
    )

    if error:
        return None, error

    discount, error = calculate_promo_discount(
        promo_code,
        order_amount
    )

    if error:
        return None, error

    return {
        "promo_code_id": promo_code.id,
        "code": promo_code.code,
        "description": promo_code.description,
        "discount_type": promo_code.discount_type,
        "discount_value": float(
            promo_code.discount_value
        ),
        "minimum_order_value": float(
            promo_code.minimum_order_value
        ),
        "maximum_discount": (
            float(promo_code.maximum_discount)
            if promo_code.maximum_discount is not None
            else None
        ),
        "order_amount": discount[
            "order_amount"
        ],
        "discount_amount": discount[
            "discount_amount"
        ],
        "final_amount": discount[
            "final_amount"
        ]
    }, None