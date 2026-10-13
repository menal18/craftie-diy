# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required, get_jwt_identity

# from extensions import db
# from models.wishlist import Wishlist
# from models.product import Product


# wishlist_bp = Blueprint(
#     "wishlist",
#     __name__,
#     url_prefix="/api/wishlist"
# )


# # =========================================================
# # GET USER WISHLIST
# # GET /api/wishlist
# # =========================================================
# @wishlist_bp.route("", methods=["GET"])
# @jwt_required()
# def get_wishlist():

#     user_id = int(get_jwt_identity())

#     wishlist_items = Wishlist.query.filter_by(
#         user_id=user_id
#     ).order_by(Wishlist.created_at.desc()).all()

#     return jsonify({
#         "wishlist": [
#             {
#                 "id": item.id,
#                 "product_id": item.product_id,
#                 "product": {
#                     "id": item.product.id,
#                     "name": item.product.name,
#                     "description": item.product.description,
#                     "price": float(item.product.price),
#                     "stock_quantity": item.product.stock_quantity,
#                     "image_url": item.product.image_url
#                 } if item.product else None,
#                 "created_at": (
#                     item.created_at.isoformat()
#                     if item.created_at
#                     else None
#                 )
#             }
#             for item in wishlist_items
#             if item.product and item.product.is_active
#         ]
#     }), 200


# # =========================================================
# # ADD TO WISHLIST
# # POST /api/wishlist
# # =========================================================
# @wishlist_bp.route("", methods=["POST"])
# @jwt_required()
# def add_to_wishlist():

#     user_id = int(get_jwt_identity())
#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     product_id = data.get("product_id")

#     if not product_id:
#         return jsonify({
#             "message": "Product ID is required"
#         }), 400

#     product = Product.query.get(product_id)

#     if not product or not product.is_active:
#         return jsonify({
#             "message": "Product not found"
#         }), 404

#     existing_item = Wishlist.query.filter_by(
#         user_id=user_id,
#         product_id=product_id
#     ).first()

#     if existing_item:
#         return jsonify({
#             "message": "Product already in wishlist"
#         }), 409

#     wishlist_item = Wishlist(
#         user_id=user_id,
#         product_id=product_id
#     )

#     db.session.add(wishlist_item)
#     db.session.commit()

#     return jsonify({
#         "message": "Product added to wishlist",
#         "wishlist": {
#             "id": wishlist_item.id,
#             "user_id": wishlist_item.user_id,
#             "product_id": wishlist_item.product_id
#         }
#     }), 201


# # =========================================================
# # REMOVE FROM WISHLIST
# # DELETE /api/wishlist/<product_id>
# # =========================================================
# @wishlist_bp.route("/<int:product_id>", methods=["DELETE"])
# @jwt_required()
# def remove_from_wishlist(product_id):

#     user_id = int(get_jwt_identity())

#     wishlist_item = Wishlist.query.filter_by(
#         user_id=user_id,
#         product_id=product_id
#     ).first()

#     if not wishlist_item:
#         return jsonify({
#             "message": "Product not found in wishlist"
#         }), 404

#     db.session.delete(wishlist_item)
#     db.session.commit()

#     return jsonify({
#         "message": "Product removed from wishlist"
#     }), 200


# # =========================================================
# # CHECK WISHLIST
# # GET /api/wishlist/check/<product_id>
# # =========================================================
# @wishlist_bp.route("/check/<int:product_id>", methods=["GET"])
# @jwt_required()
# def check_wishlist(product_id):

#     user_id = int(get_jwt_identity())

#     wishlist_item = Wishlist.query.filter_by(
#         user_id=user_id,
#         product_id=product_id
#     ).first()

#     return jsonify({
#         "product_id": product_id,
#         "in_wishlist": wishlist_item is not None
#     }), 200

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from middleware.admin_required import admin_required

from services.wishlist_service import (
    get_user_wishlist,
    get_wishlist_item,
    add_to_wishlist as add_to_wishlist_service,
    remove_from_wishlist as remove_from_wishlist_service,
    is_product_in_wishlist
)
from services.promotion_service import get_product_pricing


wishlist_bp = Blueprint(
    "wishlist",
    __name__,
    url_prefix="/api/wishlist"
)


# =========================================================
# HELPER
# =========================================================
def wishlist_item_to_dict(item):
    product = item.product
    pricing, pricing_error = get_product_pricing(product.id)

    if pricing_error or not pricing:
        pricing = {
            "original_price": float(product.price),
            "discount_amount": 0,
            "final_price": float(product.price),
            "promotion_id": None,
            "promotion_name": None,
            "discount_type": None,
            "discount_value": 0
        }

    images = sorted(
        product.images,
        key=lambda image: (
            not image.is_primary,
            image.display_order,
            image.id
        )
    )

    return {
        "id": item.id,
        "product_id": item.product_id,
        "product": {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": float(product.price),
            "original_price": pricing["original_price"],
            "discount_amount": pricing["discount_amount"],
            "final_price": pricing["final_price"],
            "promotion_id": pricing["promotion_id"],
            "promotion_name": pricing["promotion_name"],
            "discount_type": pricing["discount_type"],
            "discount_value": pricing["discount_value"],
            "stock_quantity": product.stock_quantity,
            "image_url": product.image_url,
            "is_active": product.is_active,
            "category_id": product.category_id,
            "category_name": product.category.name if product.category else None,
            "images": [
                {
                    "id": image.id,
                    "product_id": image.product_id,
                    "image_url": image.image_url,
                    "is_primary": image.is_primary,
                    "display_order": image.display_order
                }
                for image in images
            ]
        } if product else None,
        "created_at": (
            item.created_at.isoformat()
            if item.created_at
            else None
        )
    }


# =========================================================
# GET USER WISHLIST
# GET /api/wishlist
# =========================================================
@wishlist_bp.route("", methods=["GET"])
@jwt_required()
def get_wishlist():

    user_id = int(get_jwt_identity())

    wishlist_items = get_user_wishlist(user_id)

    return jsonify({
        "wishlist": [
            wishlist_item_to_dict(item)
            for item in wishlist_items
            if item.product and item.product.is_active
        ]
    }), 200


# =========================================================
# ADD TO WISHLIST
# POST /api/wishlist
# =========================================================
@wishlist_bp.route("", methods=["POST"])
@jwt_required()
def add_to_wishlist():

    user_id = int(get_jwt_identity())

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    product_id = data.get("product_id")

    if not product_id:
        return jsonify({
            "message": "Product ID is required"
        }), 400

    wishlist_item, error = add_to_wishlist_service(
        user_id=user_id,
        product_id=product_id
    )

    if error:

        if error == "Product not found":
            return jsonify({
                "message": error
            }), 404

        return jsonify({
            "message": error
        }), 409

    return jsonify({
        "message": "Product added to wishlist",
        "wishlist": {
            "id": wishlist_item.id,
            "user_id": wishlist_item.user_id,
            "product_id": wishlist_item.product_id
        }
    }), 201


# =========================================================
# REMOVE FROM WISHLIST
# DELETE /api/wishlist/<product_id>
# =========================================================
@wishlist_bp.route(
    "/<int:product_id>",
    methods=["DELETE"]
)
@jwt_required()
def remove_from_wishlist(product_id):

    user_id = int(get_jwt_identity())

    result, error = remove_from_wishlist_service(
        user_id=user_id,
        product_id=product_id
    )

    if error:
        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "message": "Product removed from wishlist"
    }), 200


# =========================================================
# CHECK WISHLIST
# GET /api/wishlist/check/<product_id>
# =========================================================
@wishlist_bp.route(
    "/check/<int:product_id>",
    methods=["GET"]
)
@jwt_required()
def check_wishlist(product_id):

    user_id = int(get_jwt_identity())

    in_wishlist = is_product_in_wishlist(
        user_id=user_id,
        product_id=product_id
    )

    return jsonify({
        "product_id": product_id,
        "in_wishlist": in_wishlist
    }), 200