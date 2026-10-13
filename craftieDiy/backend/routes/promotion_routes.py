from flask import Blueprint, request, jsonify
from datetime import datetime

from middleware.admin_required import admin_required

from services.promotion_service import (
    get_all_promotions,
    get_active_promotions,
    get_promotion_by_id,
    create_promotion,
    update_promotion,
    delete_promotion,
    get_product_promotion,
    get_product_pricing,
    get_promoted_products
)


promotion_bp = Blueprint(
    "promotion",
    __name__,
    url_prefix="/api/promotions"
)


# =========================================================
# HELPER
# =========================================================

def promotion_to_dict(promotion):
    return {
        "id": promotion.id,
        "name": promotion.name,
        "description": promotion.description,
        "product_id": promotion.product_id,

        "product_name": (
            promotion.product.name
            if promotion.product
            else None
        ),

        "discount_type": promotion.discount_type,

        "discount_value": float(
            promotion.discount_value
        ),

        "start_date": (
            promotion.start_date.isoformat()
            if promotion.start_date
            else None
        ),

        "end_date": (
            promotion.end_date.isoformat()
            if promotion.end_date
            else None
        ),

        "is_active": promotion.is_active,

        "created_at": (
            promotion.created_at.isoformat()
            if promotion.created_at
            else None
        ),

        "updated_at": (
            promotion.updated_at.isoformat()
            if promotion.updated_at
            else None
        )
    }


# =========================================================
# ADMIN - GET ALL PROMOTIONS
# =========================================================

@promotion_bp.route("", methods=["GET"])
@admin_required
def get_promotions():

    promotions = get_all_promotions(
        active_only=False
    )

    return jsonify({
        "count": len(promotions),
        "promotions": [
            promotion_to_dict(promotion)
            for promotion in promotions
        ]
    }), 200


# =========================================================
# GET ACTIVE PROMOTIONS
# =========================================================

@promotion_bp.route("/active", methods=["GET"])
def get_active_promotions_route():

    promotions = get_active_promotions()

    return jsonify({
        "count": len(promotions),
        "promotions": [
            promotion_to_dict(promotion)
            for promotion in promotions
        ]
    }), 200


# =========================================================
# GET SINGLE PROMOTION
# =========================================================

@promotion_bp.route("/<int:promotion_id>", methods=["GET"])
def get_promotion(promotion_id):

    promotion = get_promotion_by_id(
        promotion_id
    )

    if not promotion:
        return jsonify({
            "message": "Promotion not found"
        }), 404

    return jsonify({
        "promotion": promotion_to_dict(
            promotion
        )
    }), 200


# =========================================================
# CREATE PROMOTION
# =========================================================

@promotion_bp.route("", methods=["POST"])
@admin_required
def create_promotion_route():

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    start_date = data.get("start_date")
    end_date = data.get("end_date")

    if not start_date:
        return jsonify({
            "message": "Start date is required"
        }), 400

    if not end_date:
        return jsonify({
            "message": "End date is required"
        }), 400

    try:
        start_date = datetime.fromisoformat(
            start_date.replace("Z", "+00:00")
        )

        end_date = datetime.fromisoformat(
            end_date.replace("Z", "+00:00")
        )

        # Convert timezone-aware datetime
        # to naive UTC-style datetime for the
        # existing service/database setup.
        if start_date.tzinfo:
            start_date = start_date.replace(
                tzinfo=None
            )

        if end_date.tzinfo:
            end_date = end_date.replace(
                tzinfo=None
            )

    except (TypeError, ValueError):
        return jsonify({
            "message": "Invalid date format"
        }), 400

    product_id = data.get("product_id")

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

    promotion, error = create_promotion(
        name=data.get("name"),
        description=data.get("description"),
        product_id=product_id,
        discount_type=data.get(
            "discount_type",
            "percentage"
        ),
        discount_value=data.get(
            "discount_value",
            0
        ),
        start_date=start_date,
        end_date=end_date
    )

    if error:
        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Promotion created successfully",
        "promotion": promotion_to_dict(
            promotion
        )
    }), 201


# =========================================================
# UPDATE PROMOTION
# =========================================================

@promotion_bp.route(
    "/<int:promotion_id>",
    methods=["PUT"]
)
@admin_required
def update_promotion_route(promotion_id):

    promotion = get_promotion_by_id(
        promotion_id
    )

    if not promotion:
        return jsonify({
            "message": "Promotion not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    start_date = None
    end_date = None

    if "start_date" in data:
        try:
            start_date = datetime.fromisoformat(
                data["start_date"].replace(
                    "Z",
                    "+00:00"
                )
            )

            if start_date.tzinfo:
                start_date = start_date.replace(
                    tzinfo=None
                )

        except (TypeError, ValueError):
            return jsonify({
                "message": "Invalid start_date format"
            }), 400

    if "end_date" in data:
        try:
            end_date = datetime.fromisoformat(
                data["end_date"].replace(
                    "Z",
                    "+00:00"
                )
            )

            if end_date.tzinfo:
                end_date = end_date.replace(
                    tzinfo=None
                )

        except (TypeError, ValueError):
            return jsonify({
                "message": "Invalid end_date format"
            }), 400

    product_id = None

    if "product_id" in data:

        try:
            product_id = int(
                data["product_id"]
            )

        except (TypeError, ValueError):
            return jsonify({
                "message": "Invalid product_id"
            }), 400

    promotion, error = update_promotion(
        promotion=promotion,

        name=(
            data.get("name")
            if "name" in data
            else None
        ),

        description=(
            data.get("description")
            if "description" in data
            else None
        ),

        product_id=product_id,

        discount_type=(
            data.get("discount_type")
            if "discount_type" in data
            else None
        ),

        discount_value=(
            data.get("discount_value")
            if "discount_value" in data
            else None
        ),

        start_date=start_date,

        end_date=end_date,

        is_active=(
            data.get("is_active")
            if "is_active" in data
            else None
        )
    )

    if error:
        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Promotion updated successfully",
        "promotion": promotion_to_dict(
            promotion
        )
    }), 200


# =========================================================
# DEACTIVATE PROMOTION
# =========================================================

@promotion_bp.route(
    "/<int:promotion_id>",
    methods=["DELETE"]
)
@admin_required
def delete_promotion_route(promotion_id):

    promotion = get_promotion_by_id(
        promotion_id
    )

    if not promotion:
        return jsonify({
            "message": "Promotion not found"
        }), 404

    promotion, error = delete_promotion(
        promotion
    )

    if error:
        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Promotion deactivated successfully",
        "promotion": promotion_to_dict(
            promotion
        )
    }), 200


# =========================================================
# PRODUCT PROMOTION
# =========================================================

@promotion_bp.route(
    "/product/<int:product_id>",
    methods=["GET"]
)
def get_product_promotion_route(product_id):

    promotion, error = get_product_promotion(
        product_id
    )

    if error:
        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "promotion": (
            promotion_to_dict(promotion)
            if promotion
            else None
        )
    }), 200


# =========================================================
# PRODUCT PRICING
# =========================================================

@promotion_bp.route(
    "/product/<int:product_id>/pricing",
    methods=["GET"]
)
def get_product_pricing_route(product_id):

    pricing, error = get_product_pricing(
        product_id
    )

    if error:
        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "pricing": pricing
    }), 200


# =========================================================
# PROMOTED PRODUCTS
# =========================================================

@promotion_bp.route(
    "/promoted-products",
    methods=["GET"]
)
def get_promoted_products_route():

    products = get_promoted_products()

    return jsonify({
        "count": len(products),
        "products": products
    }), 200