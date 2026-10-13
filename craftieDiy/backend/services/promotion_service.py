from extensions import db
from models.promotion import Promotion
from models.product import Product

from datetime import datetime
from decimal import Decimal


# =========================================================
# GET ALL PROMOTIONS
# =========================================================

def get_all_promotions(active_only=False):
    """
    Get all promotions.

    active_only=True returns only promotions that are:
    - active
    - within start/end date
    """

    query = Promotion.query

    if active_only:
        now = datetime.utcnow()

        query = query.filter(
            Promotion.is_active == True,
            Promotion.start_date <= now,
            Promotion.end_date >= now
        )

    return query.order_by(
        Promotion.created_at.desc()
    ).all()


# =========================================================
# GET ACTIVE PROMOTIONS
# =========================================================

def get_active_promotions():
    """
    Return currently active promotions.
    """

    now = datetime.utcnow()

    return Promotion.query.filter(
        Promotion.is_active == True,
        Promotion.start_date <= now,
        Promotion.end_date >= now
    ).order_by(
        Promotion.created_at.desc()
    ).all()


# =========================================================
# GET SINGLE PROMOTION
# =========================================================

def get_promotion_by_id(promotion_id):
    """
    Get promotion by ID.
    """

    return db.session.get(
        Promotion,
        promotion_id
    )


# =========================================================
# GET PROMOTION FOR PRODUCT
# =========================================================

def get_product_promotion(product_id):
    """
    Get the currently active promotion for a product.

    Only one active promotion is returned.
    """

    product = db.session.get(
        Product,
        product_id
    )

    if not product:
        return None, "Product not found"

    now = datetime.utcnow()

    promotion = Promotion.query.filter(
        Promotion.product_id == product_id,
        Promotion.is_active == True,
        Promotion.start_date <= now,
        Promotion.end_date >= now
    ).order_by(
        Promotion.created_at.desc()
    ).first()

    return promotion, None


# =========================================================
# CREATE PROMOTION
# =========================================================

def create_promotion(
    name,
    description,
    product_id,
    discount_type,
    discount_value,
    start_date,
    end_date
):
    """
    Create a new product promotion.
    """

    # -----------------------------------------------------
    # Validate name
    # -----------------------------------------------------

    if not name:
        return None, "Promotion name is required"

    name = name.strip()

    if not name:
        return None, "Promotion name is required"

    # -----------------------------------------------------
    # Validate product
    # -----------------------------------------------------

    product = db.session.get(
        Product,
        product_id
    )

    if not product:
        return None, "Product not found"

    # -----------------------------------------------------
    # Validate discount type
    # -----------------------------------------------------

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

    # Percentage cannot exceed 100
    if discount_type == "percentage":

        if discount_value > 100:
            return None, (
                "Percentage discount cannot exceed 100"
            )

    # Fixed discount cannot exceed product price
    if discount_type == "fixed":

        if discount_value > Decimal(
            str(product.price)
        ):
            return None, (
                "Fixed discount cannot exceed product price"
            )

    # -----------------------------------------------------
    # Validate dates
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
    # Create promotion
    # -----------------------------------------------------

    promotion = Promotion(
        name=name,
        description=description,
        product_id=product_id,
        discount_type=discount_type,
        discount_value=discount_value,
        start_date=start_date,
        end_date=end_date,
        is_active=True
    )

    db.session.add(promotion)

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return promotion, None


# =========================================================
# UPDATE PROMOTION
# =========================================================

def update_promotion(
    promotion,
    name=None,
    description=None,
    product_id=None,
    discount_type=None,
    discount_value=None,
    start_date=None,
    end_date=None,
    is_active=None
):
    """
    Update an existing promotion.
    """

    # -----------------------------------------------------
    # Name
    # -----------------------------------------------------

    if name is not None:

        name = name.strip()

        if not name:
            return None, (
                "Promotion name cannot be empty"
            )

        promotion.name = name

    # -----------------------------------------------------
    # Description
    # -----------------------------------------------------

    if description is not None:
        promotion.description = description

    # -----------------------------------------------------
    # Product
    # -----------------------------------------------------

    if product_id is not None:

        product = db.session.get(
            Product,
            product_id
        )

        if not product:
            return None, "Product not found"

        promotion.product_id = product_id

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

        promotion.discount_type = discount_type

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
            promotion.discount_type
        )

        product = db.session.get(
            Product,
            promotion.product_id
        )

        if current_type == "percentage":

            if discount_value > 100:
                return None, (
                    "Percentage discount cannot exceed 100"
                )

        elif current_type == "fixed":

            if product and discount_value > Decimal(
                str(product.price)
            ):
                return None, (
                    "Fixed discount cannot exceed product price"
                )

        promotion.discount_value = discount_value

    # -----------------------------------------------------
    # Dates
    # -----------------------------------------------------

    if start_date is not None:
        promotion.start_date = start_date

    if end_date is not None:
        promotion.end_date = end_date

    if promotion.end_date < promotion.start_date:
        return None, (
            "End date cannot be before start date"
        )

    # -----------------------------------------------------
    # Active status
    # -----------------------------------------------------

    if is_active is not None:
        promotion.is_active = bool(
            is_active
        )

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return promotion, None


# =========================================================
# DELETE / DEACTIVATE PROMOTION
# =========================================================

def delete_promotion(promotion):
    """
    Soft delete a promotion.

    The promotion is not removed from the database.
    """

    promotion.is_active = False

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return promotion, None


# =========================================================
# CALCULATE PRODUCT DISCOUNT
# =========================================================

def calculate_discount(
    product,
    promotion=None
):
    """
    Calculate the discounted price for one product.

    Returns:
        original_price
        discount_amount
        final_price
    """

    original_price = Decimal(
        str(product.price)
    )

    # -----------------------------------------------------
    # No promotion
    # -----------------------------------------------------

    if not promotion:

        return {
            "original_price": float(
                original_price
            ),
            "discount_amount": 0.0,
            "final_price": float(
                original_price
            )
        }

    # -----------------------------------------------------
    # Check promotion status
    # -----------------------------------------------------

    now = datetime.utcnow()

    if not promotion.is_active:

        return {
            "original_price": float(
                original_price
            ),
            "discount_amount": 0.0,
            "final_price": float(
                original_price
            )
        }

    if now < promotion.start_date:

        return {
            "original_price": float(
                original_price
            ),
            "discount_amount": 0.0,
            "final_price": float(
                original_price
            )
        }

    if now > promotion.end_date:

        return {
            "original_price": float(
                original_price
            ),
            "discount_amount": 0.0,
            "final_price": float(
                original_price
            )
        }

    # -----------------------------------------------------
    # Calculate discount
    # -----------------------------------------------------

    if promotion.discount_type == "percentage":

        discount_amount = (
            original_price
            * Decimal(
                str(promotion.discount_value)
            )
            / Decimal("100")
        )

    else:

        discount_amount = Decimal(
            str(promotion.discount_value)
        )

    # -----------------------------------------------------
    # Prevent discount > product price
    # -----------------------------------------------------

    if discount_amount > original_price:
        discount_amount = original_price

    final_price = (
        original_price
        - discount_amount
    )

    if final_price < 0:
        final_price = Decimal("0")

    return {
        "original_price": float(
            original_price
        ),
        "discount_amount": float(
            round(discount_amount, 2)
        ),
        "final_price": float(
            round(final_price, 2)
        )
    }


# =========================================================
# GET PRODUCT PRICING
# =========================================================

def get_product_pricing(product_id):
    """
    Get product price with currently active promotion.

    IMPORTANT:
    This is the single place where product promotion
    pricing should be calculated.
    """

    product = db.session.get(
        Product,
        product_id
    )

    if not product:
        return None, "Product not found"

    promotion, error = get_product_promotion(
        product_id
    )

    if error:
        return None, error

    pricing = calculate_discount(
        product,
        promotion
    )

    return {
        "product_id": product.id,
        "product_name": product.name,
        "promotion_id": (
            promotion.id
            if promotion
            else None
        ),
        "promotion_name": (
            promotion.name
            if promotion
            else None
        ),
        "discount_type": (
            promotion.discount_type
            if promotion
            else None
        ),
        "discount_value": (
            float(promotion.discount_value)
            if promotion
            else 0
        ),
        "original_price": pricing[
            "original_price"
        ],
        "discount_amount": pricing[
            "discount_amount"
        ],
        "final_price": pricing[
            "final_price"
        ]
    }, None


# =========================================================
# GET PROMOTED PRODUCTS
# =========================================================

def get_promoted_products():
    """
    Get products which currently have an active promotion.
    """

    now = datetime.utcnow()

    promotions = Promotion.query.filter(
        Promotion.is_active == True,
        Promotion.start_date <= now,
        Promotion.end_date >= now
    ).all()

    result = []

    for promotion in promotions:

        product = db.session.get(
            Product,
            promotion.product_id
        )

        if not product:
            continue

        if not product.is_active:
            continue

        pricing = calculate_discount(
            product,
            promotion
        )

        result.append({
            "product_id": product.id,
            "product_name": product.name,
            "promotion_id": promotion.id,
            "promotion_name": promotion.name,
            "discount_type": promotion.discount_type,
            "discount_value": float(
                promotion.discount_value
            ),
            "original_price": pricing[
                "original_price"
            ],
            "discount_amount": pricing[
                "discount_amount"
            ],
            "final_price": pricing[
                "final_price"
            ]
        })

    return result