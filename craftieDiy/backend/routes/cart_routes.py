# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from datetime import datetime

# from extensions import db
# from models.cart import Cart
# from models.cart_item import CartItem
# from models.product import Product


# cart_bp = Blueprint("cart", __name__, url_prefix="/api/cart")


# # ---------------------------------------------------------
# # Helper: Get or Create Cart
# # ---------------------------------------------------------
# def get_or_create_cart(user_id):
#     cart = Cart.query.filter_by(user_id=user_id).first()

#     if not cart:
#         cart = Cart(
#             user_id=user_id,
#             created_at=datetime.utcnow(),
#             updated_at=datetime.utcnow()
#         )
#         db.session.add(cart)
#         db.session.commit()

#     return cart


# # ---------------------------------------------------------
# # Helper: Cart Response
# # ---------------------------------------------------------
# def cart_response(cart):
#     items = []

#     subtotal = 0

#     for item in cart.items:
#         item_subtotal = float(item.product.price) * item.quantity
#         subtotal += item_subtotal

#         items.append({
#             "id": item.id,
#             "product_id": item.product_id,
#             "product_name": item.product.name,
#             "product_description": item.product.description,
#             "image_url": item.product.image_url,
#             "unit_price": float(item.product.price),
#             "quantity": item.quantity,
#             "subtotal": round(item_subtotal, 2)
#         })

#     return {
#         "cart_id": cart.id,
#         "user_id": cart.user_id,
#         "items": items,
#         "total_items": sum(item.quantity for item in cart.items),
#         "subtotal": round(subtotal, 2)
#     }


# # =========================================================
# # GET CART
# # =========================================================
# @cart_bp.route("", methods=["GET"])
# @jwt_required()
# def get_cart():

#     user_id = int(get_jwt_identity())

#     cart = Cart.query.filter_by(user_id=user_id).first()

#     # User does not have a cart yet
#     if not cart:
#         return jsonify({
#             "cart_id": None,
#             "user_id": user_id,
#             "items": [],
#             "total_items": 0,
#             "subtotal": 0
#         }), 200

#     return jsonify(cart_response(cart)), 200


# # =========================================================
# # ADD PRODUCT TO CART
# # =========================================================
# @cart_bp.route("/add", methods=["POST"])
# @jwt_required()
# def add_to_cart():

#     user_id = int(get_jwt_identity())

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     product_id = data.get("product_id")
#     quantity = data.get("quantity", 1)

#     # Validate product_id
#     if not product_id:
#         return jsonify({
#             "message": "product_id is required"
#         }), 400

#     # Validate quantity
#     try:
#         quantity = int(quantity)
#     except (TypeError, ValueError):
#         return jsonify({
#             "message": "Quantity must be a valid number"
#         }), 400

#     if quantity <= 0:
#         return jsonify({
#             "message": "Quantity must be greater than 0"
#         }), 400

#     # Find product
#     product = Product.query.filter_by(
#         id=product_id,
#         is_active=True
#     ).first()

#     if not product:
#         return jsonify({
#             "message": "Product not found"
#         }), 404

#     # Check stock
#     if product.stock_quantity <= 0:
#         return jsonify({
#             "message": "Product is out of stock"
#         }), 400

#     if quantity > product.stock_quantity:
#         return jsonify({
#             "message": f"Only {product.stock_quantity} items available"
#         }), 400

#     # Get/Create cart
#     cart = get_or_create_cart(user_id)

#     # Check if product already exists
#     cart_item = CartItem.query.filter_by(
#         cart_id=cart.id,
#         product_id=product.id
#     ).first()

#     if cart_item:

#         new_quantity = cart_item.quantity + quantity

#         if new_quantity > product.stock_quantity:
#             return jsonify({
#                 "message": f"Only {product.stock_quantity} items available"
#             }), 400

#         cart_item.quantity = new_quantity

#     else:

#         cart_item = CartItem(
#             cart_id=cart.id,
#             product_id=product.id,
#             quantity=quantity
#         )

#         db.session.add(cart_item)

#     cart.updated_at = datetime.utcnow()

#     db.session.commit()

#     return jsonify({
#         "message": "Product added to cart",
#         "cart": cart_response(cart)
#     }), 200


# # =========================================================
# # UPDATE CART ITEM QUANTITY
# # =========================================================
# @cart_bp.route("/update/<int:item_id>", methods=["PUT"])
# @jwt_required()
# def update_cart_item(item_id):

#     user_id = int(get_jwt_identity())

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     quantity = data.get("quantity")

#     if quantity is None:
#         return jsonify({
#             "message": "quantity is required"
#         }), 400

#     try:
#         quantity = int(quantity)
#     except (TypeError, ValueError):
#         return jsonify({
#             "message": "Quantity must be a valid number"
#         }), 400

#     if quantity <= 0:
#         return jsonify({
#             "message": "Quantity must be greater than 0"
#         }), 400

#     # Find user's cart
#     cart = Cart.query.filter_by(user_id=user_id).first()

#     if not cart:
#         return jsonify({
#             "message": "Cart not found"
#         }), 404

#     # Find cart item
#     cart_item = CartItem.query.filter_by(
#         id=item_id,
#         cart_id=cart.id
#     ).first()

#     if not cart_item:
#         return jsonify({
#             "message": "Cart item not found"
#         }), 404

#     # Check product stock
#     product = Product.query.filter_by(
#         id=cart_item.product_id,
#         is_active=True
#     ).first()

#     if not product:
#         return jsonify({
#             "message": "Product not found"
#         }), 404

#     if quantity > product.stock_quantity:
#         return jsonify({
#             "message": f"Only {product.stock_quantity} items available"
#         }), 400

#     cart_item.quantity = quantity
#     cart.updated_at = datetime.utcnow()

#     db.session.commit()

#     return jsonify({
#         "message": "Cart updated successfully",
#         "cart": cart_response(cart)
#     }), 200


# # =========================================================
# # REMOVE CART ITEM
# # =========================================================
# @cart_bp.route("/remove/<int:item_id>", methods=["DELETE"])
# @jwt_required()
# def remove_cart_item(item_id):

#     user_id = int(get_jwt_identity())

#     cart = Cart.query.filter_by(user_id=user_id).first()

#     if not cart:
#         return jsonify({
#             "message": "Cart not found"
#         }), 404

#     cart_item = CartItem.query.filter_by(
#         id=item_id,
#         cart_id=cart.id
#     ).first()

#     if not cart_item:
#         return jsonify({
#             "message": "Cart item not found"
#         }), 404

#     db.session.delete(cart_item)

#     cart.updated_at = datetime.utcnow()

#     db.session.commit()

#     return jsonify({
#         "message": "Product removed from cart",
#         "cart": cart_response(cart)
#     }), 200


# # =========================================================
# # CLEAR CART
# # =========================================================
# @cart_bp.route("/clear", methods=["DELETE"])
# @jwt_required()
# def clear_cart():

#     user_id = int(get_jwt_identity())

#     cart = Cart.query.filter_by(user_id=user_id).first()

#     if not cart:
#         return jsonify({
#             "message": "Cart is already empty"
#         }), 200

#     CartItem.query.filter_by(
#         cart_id=cart.id
#     ).delete()

#     cart.updated_at = datetime.utcnow()

#     db.session.commit()

#     return jsonify({
#         "message": "Cart cleared successfully",
#         "cart": cart_response(cart)
#     }), 200

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from services.cart_service import (
    get_cart,
    get_cart_response,
    add_to_cart as add_to_cart_service,
    update_cart_item as update_cart_item_service,
    remove_from_cart,
    clear_cart as clear_cart_service
)


cart_bp = Blueprint(
    "cart",
    __name__,
    url_prefix="/api/cart"
)


# =========================================================
# GET CART
# GET /api/cart
# =========================================================
@cart_bp.route("", methods=["GET"])
@jwt_required()
def get_cart_route():

    user_id = int(get_jwt_identity())

    cart = get_cart(user_id)

    # User does not have a cart yet
    if not cart:
        return jsonify({
            "cart_id": None,
            "user_id": user_id,
            "items": [],
            "total_items": 0,
            "subtotal": 0
        }), 200

    return jsonify(
        get_cart_response(cart)
    ), 200


# =========================================================
# ADD PRODUCT TO CART
# POST /api/cart/add
# =========================================================
@cart_bp.route("/add", methods=["POST"])
@jwt_required()
def add_to_cart_route():

    user_id = int(get_jwt_identity())

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)

    if not product_id:
        return jsonify({
            "message": "product_id is required"
        }), 400

    cart_item, error = add_to_cart_service(
        user_id=user_id,
        product_id=product_id,
        quantity=quantity
    )

    if error:

        if error == "Product not found":
            return jsonify({
                "message": error
            }), 404

        return jsonify({
            "message": error
        }), 400

    cart = get_cart(user_id)

    return jsonify({
        "message": "Product added to cart",
        "cart": get_cart_response(cart)
    }), 200


# =========================================================
# UPDATE CART ITEM QUANTITY
# PUT /api/cart/update/<item_id>
# =========================================================
@cart_bp.route(
    "/update/<int:item_id>",
    methods=["PUT"]
)
@jwt_required()
def update_cart_item_route(item_id):

    user_id = int(get_jwt_identity())

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    quantity = data.get("quantity")

    if quantity is None:
        return jsonify({
            "message": "quantity is required"
        }), 400

    cart_item, error = update_cart_item_service(
        user_id=user_id,
        item_id=item_id,
        quantity=quantity
    )

    if error:

        if error in [
            "Cart not found",
            "Cart item not found",
            "Product not found"
        ]:
            return jsonify({
                "message": error
            }), 404

        return jsonify({
            "message": error
        }), 400

    cart = get_cart(user_id)

    return jsonify({
        "message": "Cart updated successfully",
        "cart": get_cart_response(cart)
    }), 200


# =========================================================
# REMOVE CART ITEM
# DELETE /api/cart/remove/<item_id>
# =========================================================
@cart_bp.route(
    "/remove/<int:item_id>",
    methods=["DELETE"]
)
@jwt_required()
def remove_cart_item_route(item_id):

    user_id = int(get_jwt_identity())

    result, error = remove_from_cart(
        user_id=user_id,
        item_id=item_id
    )

    if error:
        return jsonify({
            "message": error
        }), 404

    cart = get_cart(user_id)

    return jsonify({
        "message": "Product removed from cart",
        "cart": get_cart_response(cart)
    }), 200


# =========================================================
# CLEAR CART
# DELETE /api/cart/clear
# =========================================================
@cart_bp.route(
    "/clear",
    methods=["DELETE"]
)
@jwt_required()
def clear_cart_route():

    user_id = int(get_jwt_identity())

    result, error = clear_cart_service(
        user_id=user_id
    )

    if error:

        if error == "Cart is already empty":
            return jsonify({
                "message": error
            }), 200

        return jsonify({
            "message": error
        }), 404

    cart = get_cart(user_id)

    return jsonify({
        "message": "Cart cleared successfully",
        "cart": get_cart_response(cart)
    }), 200