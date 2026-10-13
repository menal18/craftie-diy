

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from services.review_service import (
    get_product_reviews,
    get_review_by_id,
    create_review,
    update_review,
    delete_review,
    get_product_rating_summary
)


review_bp = Blueprint(
    "review",
    __name__,
    url_prefix="/api/reviews"
)


# =========================================================
# HELPER: CONVERT REVIEW TO JSON
# =========================================================

def review_to_dict(review):

    return {
        "id": review.id,
        "user_id": review.user_id,
        "product_id": review.product_id,
        "rating": review.rating,
        "comment": review.comment,

        "user_name": (
            review.user.name
            if review.user
            else None
        ),

        "created_at": (
            review.created_at.isoformat()
            if review.created_at
            else None
        ),

        "updated_at": (
            review.updated_at.isoformat()
            if review.updated_at
            else None
        )
    }


# =========================================================
# GET ALL REVIEWS FOR A PRODUCT
# =========================================================

@review_bp.route(
    "/product/<int:product_id>",
    methods=["GET"]
)
def get_product_reviews_route(product_id):

    reviews, error = get_product_reviews(
        product_id
    )

    if error:
        return jsonify({
            "message": error
        }), 404

    summary, summary_error = get_product_rating_summary(
        product_id
    )

    if summary_error:
        return jsonify({
            "message": summary_error
        }), 404

    return jsonify({
        "product_id": product_id,
        "total_reviews": summary["total_reviews"],
        "average_rating": summary["average_rating"],
        "reviews": [
            review_to_dict(review)
            for review in reviews
        ]
    }), 200


# =========================================================
# GET SINGLE REVIEW
# =========================================================

@review_bp.route(
    "/<int:review_id>",
    methods=["GET"]
)
def get_review(review_id):

    review = get_review_by_id(
        review_id
    )

    if not review:
        return jsonify({
            "message": "Review not found"
        }), 404

    return jsonify({
        "review": review_to_dict(review)
    }), 200


# =========================================================
# ADD REVIEW
# =========================================================

@review_bp.route(
    "",
    methods=["POST"]
)
@jwt_required()
def add_review():

    user_id = int(
        get_jwt_identity()
    )

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    product_id = data.get(
        "product_id"
    )

    rating = data.get(
        "rating"
    )

    comment = data.get(
        "comment",
        ""
    )

    # -----------------------------------------------------
    # Validate product ID
    # -----------------------------------------------------

    if not product_id:
        return jsonify({
            "message": "product_id is required"
        }), 400

    try:
        product_id = int(product_id)
    except (TypeError, ValueError):
        return jsonify({
            "message": "Invalid product_id"
        }), 400

    # -----------------------------------------------------
    # Validate rating exists
    # -----------------------------------------------------

    if rating is None:
        return jsonify({
            "message": "Rating is required"
        }), 400

    # -----------------------------------------------------
    # Create review
    # -----------------------------------------------------

    review, error = create_review(
        user_id=user_id,
        product_id=product_id,
        rating=rating,
        comment=comment
    )

    if error:

        if error == "Product not found":
            return jsonify({
                "message": error
            }), 404

        if error == "You have already reviewed this product":
            return jsonify({
                "message": error
            }), 409

        if error == (
            "You can review only products from delivered or completed orders"
        ):
            return jsonify({
                "message": error
            }), 403

        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Review added successfully",
        "review": review_to_dict(review)
    }), 201


# =========================================================
# UPDATE OWN REVIEW
# =========================================================

@review_bp.route(
    "/<int:review_id>",
    methods=["PUT"]
)
@jwt_required()
def update_review_route(review_id):

    user_id = int(
        get_jwt_identity()
    )

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    rating = data.get(
        "rating"
    ) if "rating" in data else None

    comment = data.get(
        "comment"
    ) if "comment" in data else None

    review, error = update_review(
        user_id=user_id,
        review_id=review_id,
        rating=rating,
        comment=comment
    )

    if error:
        status_code = (
            404
            if error == "Review not found"
            else 403
            if error
            == "You can edit reviews only for products from delivered or completed orders"
            else 400
        )
        return jsonify({
            "message": error
        }), status_code

    return jsonify({
        "message": "Review updated successfully",
        "review": review_to_dict(review)
    }), 200


# =========================================================
# DELETE OWN REVIEW
# =========================================================

@review_bp.route(
    "/<int:review_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_review_route(review_id):

    user_id = int(
        get_jwt_identity()
    )

    success, error = delete_review(
        user_id=user_id,
        review_id=review_id
    )

    if error:
        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "message": "Review deleted successfully"
    }), 200