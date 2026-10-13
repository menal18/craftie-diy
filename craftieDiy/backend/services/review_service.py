from extensions import db
from models.review import Review
from models.product import Product
from models.order import Order
from models.order_item import OrderItem
from sqlalchemy import func


# =========================================================
# GET REVIEWS FOR A PRODUCT
# =========================================================

def get_product_reviews(product_id):
    """
    Get all reviews for a product.
    Newest reviews are returned first.
    """

    product = db.session.get(Product, product_id)

    if not product:
        return None, "Product not found"

    reviews = Review.query.filter_by(
        product_id=product_id
    ).order_by(
        Review.created_at.desc()
    ).all()

    return reviews, None


# =========================================================
# GET SINGLE REVIEW
# =========================================================

def get_review_by_id(review_id):
    """
    Get a review by its ID.
    """

    return db.session.get(
        Review,
        review_id
    )


# =========================================================
# CHECK WHETHER USER PURCHASED PRODUCT
# =========================================================

def user_purchased_product(user_id, product_id):
    """
    Check whether the user purchased the product in a delivered or
    completed order.
    """

    purchase = (
        db.session.query(OrderItem)
        .join(
            Order,
            OrderItem.order_id == Order.id
        )
        .filter(
            Order.user_id == user_id,
            OrderItem.product_id == product_id,
            func.lower(Order.order_status).in_(("delivered", "completed"))
        )
        .first()
    )

    return purchase is not None


# =========================================================
# CHECK EXISTING REVIEW
# =========================================================

def get_user_product_review(user_id, product_id):
    """
    Get the user's existing review for a product.
    """

    return Review.query.filter_by(
        user_id=user_id,
        product_id=product_id
    ).first()


# =========================================================
# CREATE REVIEW
# =========================================================

def create_review(
    user_id,
    product_id,
    rating,
    comment=None
):
    """
    Create a review for a purchased product.
    """

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
    # Validate rating
    # -----------------------------------------------------

    try:
        rating = int(rating)
    except (ValueError, TypeError):
        return None, "Rating must be a number"

    if rating < 1 or rating > 5:
        return None, (
            "Rating must be between 1 and 5"
        )

    # -----------------------------------------------------
    # Check purchase
    # -----------------------------------------------------

    if not user_purchased_product(
        user_id,
        product_id
    ):
        return None, (
            "You can review only products from delivered or completed orders"
        )

    # -----------------------------------------------------
    # Prevent duplicate review
    # -----------------------------------------------------

    existing_review = get_user_product_review(
        user_id,
        product_id
    )

    if existing_review:
        return None, (
            "You have already reviewed this product"
        )

    # -----------------------------------------------------
    # Create review
    # -----------------------------------------------------

    review = Review(
        user_id=user_id,
        product_id=product_id,
        rating=rating,
        comment=comment.strip()
        if comment
        else None
    )

    db.session.add(review)

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return review, None


# =========================================================
# UPDATE REVIEW
# =========================================================

def update_review(
    user_id,
    review_id,
    rating=None,
    comment=None
):
    """
    Update a review belonging to the logged-in user.
    """

    review = Review.query.filter_by(
        id=review_id,
        user_id=user_id
    ).first()

    if not review:
        return None, "Review not found"

    if not user_purchased_product(
        user_id,
        review.product_id
    ):
        return None, (
            "You can edit reviews only for products from delivered or completed orders"
        )

    # -----------------------------------------------------
    # Update rating
    # -----------------------------------------------------

    if rating is not None:

        try:
            rating = int(rating)
        except (ValueError, TypeError):
            return None, "Rating must be a number"

        if rating < 1 or rating > 5:
            return None, (
                "Rating must be between 1 and 5"
            )

        review.rating = rating

    # -----------------------------------------------------
    # Update comment
    # -----------------------------------------------------

    if comment is not None:

        review.comment = (
            comment.strip()
            if comment.strip()
            else None
        )

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return review, None


# =========================================================
# DELETE REVIEW
# =========================================================

def delete_review(user_id, review_id):
    """
    Delete a review belonging to the logged-in user.
    """

    review = Review.query.filter_by(
        id=review_id,
        user_id=user_id
    ).first()

    if not review:
        return None, "Review not found"

    db.session.delete(review)

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return None, str(e)

    return True, None


# =========================================================
# GET USER REVIEWS
# =========================================================

def get_user_reviews(user_id):
    """
    Get all reviews created by a user.
    """

    return Review.query.filter_by(
        user_id=user_id
    ).order_by(
        Review.created_at.desc()
    ).all()


# =========================================================
# GET PRODUCT RATING SUMMARY
# =========================================================

def get_product_rating_summary(product_id):
    """
    Calculate rating statistics for a product.
    """

    product = db.session.get(
        Product,
        product_id
    )

    if not product:
        return None, "Product not found"

    reviews = Review.query.filter_by(
        product_id=product_id
    ).all()

    total_reviews = len(reviews)

    if total_reviews == 0:
        return {
            "product_id": product_id,
            "average_rating": 0,
            "total_reviews": 0,
            "rating_distribution": {
                "5": 0,
                "4": 0,
                "3": 0,
                "2": 0,
                "1": 0
            }
        }, None

    total_rating = sum(
        review.rating
        for review in reviews
    )

    average_rating = round(
        total_rating / total_reviews,
        2
    )

    rating_distribution = {
        "5": 0,
        "4": 0,
        "3": 0,
        "2": 0,
        "1": 0
    }

    for review in reviews:

        rating_key = str(
            review.rating
        )

        if rating_key in rating_distribution:
            rating_distribution[
                rating_key
            ] += 1

    return {
        "product_id": product_id,
        "average_rating": average_rating,
        "total_reviews": total_reviews,
        "rating_distribution": rating_distribution
    }, None