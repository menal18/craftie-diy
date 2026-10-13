# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required

# from extensions import db
# from models.product import Product
# from models.category import Category


# product_bp = Blueprint(
#     "product",
#     __name__,
#     url_prefix="/api/products"
# )


# # =========================================================
# # GET ALL ACTIVE PRODUCTS
# # GET /api/products
# # =========================================================
# @product_bp.route("", methods=["GET"])
# def get_products():

#     products = Product.query.filter_by(
#         is_active=True
#     ).order_by(Product.created_at.desc()).all()

#     return jsonify({
#         "products": [
#             {
#                 "id": product.id,
#                 "category_id": product.category_id,
#                 "category_name": (
#                     product.category.name
#                     if product.category
#                     else None
#                 ),
#                 "name": product.name,
#                 "description": product.description,
#                 "price": float(product.price),
#                 "stock_quantity": product.stock_quantity,
#                 "image_url": product.image_url,
#                 "is_active": product.is_active,
#                 "created_at": (
#                     product.created_at.isoformat()
#                     if product.created_at
#                     else None
#                 )
#             }
#             for product in products
#         ]
#     }), 200


# # =========================================================
# # GET SINGLE PRODUCT
# # GET /api/products/<id>
# # =========================================================
# @product_bp.route("/<int:product_id>", methods=["GET"])
# def get_product(product_id):

#     product = Product.query.get(product_id)

#     if not product or not product.is_active:
#         return jsonify({
#             "message": "Product not found"
#         }), 404

#     return jsonify({
#         "product": {
#             "id": product.id,
#             "category_id": product.category_id,
#             "category_name": (
#                 product.category.name
#                 if product.category
#                 else None
#             ),
#             "name": product.name,
#             "description": product.description,
#             "price": float(product.price),
#             "stock_quantity": product.stock_quantity,
#             "image_url": product.image_url,
#             "is_active": product.is_active,
#             "created_at": (
#                 product.created_at.isoformat()
#                 if product.created_at
#                 else None
#             )
#         }
#     }), 200


# # =========================================================
# # CREATE PRODUCT
# # POST /api/products
# # =========================================================
# @product_bp.route("", methods=["POST"])
# @jwt_required()
# def create_product():

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     category_id = data.get("category_id")
#     name = data.get("name", "").strip()
#     description = data.get("description")
#     price = data.get("price")
#     stock_quantity = data.get("stock_quantity", 0)
#     image_url = data.get("image_url")

#     if not category_id:
#         return jsonify({
#             "message": "Category ID is required"
#         }), 400

#     if not name:
#         return jsonify({
#             "message": "Product name is required"
#         }), 400

#     if price is None:
#         return jsonify({
#             "message": "Product price is required"
#         }), 400

#     # Check category
#     category = Category.query.get(category_id)

#     if not category or not category.is_active:
#         return jsonify({
#             "message": "Category not found"
#         }), 404

#     # Check duplicate product name
#     existing_product = Product.query.filter_by(
#         name=name
#     ).first()

#     if existing_product:
#         return jsonify({
#             "message": "Product already exists"
#         }), 409

#     try:
#         price = float(price)
#         stock_quantity = int(stock_quantity)
#     except (ValueError, TypeError):
#         return jsonify({
#             "message": "Invalid price or stock quantity"
#         }), 400

#     if price < 0:
#         return jsonify({
#             "message": "Price cannot be negative"
#         }), 400

#     if stock_quantity < 0:
#         return jsonify({
#             "message": "Stock quantity cannot be negative"
#         }), 400

#     product = Product(
#         category_id=category_id,
#         name=name,
#         description=description,
#         price=price,
#         stock_quantity=stock_quantity,
#         image_url=image_url,
#         is_active=True
#     )

#     db.session.add(product)
#     db.session.commit()

#     return jsonify({
#         "message": "Product created successfully",
#         "product": {
#             "id": product.id,
#             "category_id": product.category_id,
#             "name": product.name,
#             "description": product.description,
#             "price": float(product.price),
#             "stock_quantity": product.stock_quantity,
#             "image_url": product.image_url,
#             "is_active": product.is_active
#         }
#     }), 201


# # =========================================================
# # UPDATE PRODUCT
# # PUT /api/products/<id>
# # =========================================================
# @product_bp.route("/<int:product_id>", methods=["PUT"])
# @jwt_required()
# def update_product(product_id):

#     product = Product.query.get(product_id)

#     if not product:
#         return jsonify({
#             "message": "Product not found"
#         }), 404

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     if "category_id" in data:

#         category = Category.query.get(data["category_id"])

#         if not category or not category.is_active:
#             return jsonify({
#                 "message": "Category not found"
#             }), 404

#         product.category_id = data["category_id"]

#     if "name" in data:

#         name = data["name"].strip()

#         if not name:
#             return jsonify({
#                 "message": "Product name cannot be empty"
#             }), 400

#         existing_product = Product.query.filter(
#             Product.name == name,
#             Product.id != product_id
#         ).first()

#         if existing_product:
#             return jsonify({
#                 "message": "Product already exists"
#             }), 409

#         product.name = name

#     if "description" in data:
#         product.description = data["description"]

#     if "price" in data:
#         try:
#             price = float(data["price"])
#         except (ValueError, TypeError):
#             return jsonify({
#                 "message": "Invalid price"
#             }), 400

#         if price < 0:
#             return jsonify({
#                 "message": "Price cannot be negative"
#             }), 400

#         product.price = price

#     if "stock_quantity" in data:
#         try:
#             stock_quantity = int(data["stock_quantity"])
#         except (ValueError, TypeError):
#             return jsonify({
#                 "message": "Invalid stock quantity"
#             }), 400

#         if stock_quantity < 0:
#             return jsonify({
#                 "message": "Stock quantity cannot be negative"
#             }), 400

#         product.stock_quantity = stock_quantity

#     if "image_url" in data:
#         product.image_url = data["image_url"]

#     if "is_active" in data:
#         product.is_active = bool(data["is_active"])

#     db.session.commit()

#     return jsonify({
#         "message": "Product updated successfully",
#         "product": {
#             "id": product.id,
#             "category_id": product.category_id,
#             "name": product.name,
#             "description": product.description,
#             "price": float(product.price),
#             "stock_quantity": product.stock_quantity,
#             "image_url": product.image_url,
#             "is_active": product.is_active
#         }
#     }), 200


# # =========================================================
# # DELETE PRODUCT
# # DELETE /api/products/<id>
# # =========================================================
# @product_bp.route("/<int:product_id>", methods=["DELETE"])
# @jwt_required()
# def delete_product(product_id):

#     product = Product.query.get(product_id)

#     if not product:
#         return jsonify({
#             "message": "Product not found"
#         }), 404

#     # Soft delete
#     product.is_active = False

#     db.session.commit()

#     return jsonify({
#         "message": "Product deleted successfully"
#     }), 200

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from middleware.admin_required import admin_required

from services.product_service import (
    get_all_products,
    get_bestselling_products,
    get_product_by_id,
    get_related_products,
    search_products as search_products_service,
    create_product as create_product_service,
    update_product as update_product_service,
    delete_product as delete_product_service
)
from services.promotion_service import get_product_pricing


product_bp = Blueprint(
    "product",
    __name__,
    url_prefix="/api/products"
)


# =========================================================
# PRODUCT RESPONSE HELPER
# =========================================================
def product_to_dict(product):

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
            image.created_at
        )
    )

    image_url = (
        images[0].image_url
        if images
        else product.image_url
    )

    return {
        "id": product.id,
        "category_id": product.category_id,
        "category_name": (
            product.category.name
            if product.category
            else None
        ),
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
        "image_url": image_url,
        "images": [
            {
                "id": image.id,
                "product_id": image.product_id,
                "image_url": image.image_url,
                "is_primary": image.is_primary,
                "display_order": image.display_order,
                "created_at": (
                    image.created_at.isoformat()
                    if image.created_at
                    else None
                )
            }
            for image in images
        ],
        "is_active": product.is_active,
        "created_at": (
            product.created_at.isoformat()
            if product.created_at
            else None
        )
    }


# =========================================================
# GET ALL ACTIVE PRODUCTS
# GET /api/products
# =========================================================
@product_bp.route("", methods=["GET"])
def get_products():

    products = get_all_products(
        active_only=True
    )

    return jsonify({
        "products": [
            product_to_dict(product)
            for product in products
        ]
    }), 200


# =========================================================
# SEARCH ACTIVE PRODUCTS
# GET /api/products/search?q=term
# =========================================================
@product_bp.route("/search", methods=["GET"])
def search_products():

    search_term = request.args.get("q", "").strip()

    if len(search_term) > 100:
        return jsonify({
            "message": "Search query must be 100 characters or fewer"
        }), 400

    products = (
        search_products_service(search_term)
        if search_term
        else []
    )

    return jsonify({
        "products": [
            product_to_dict(product)
            for product in products
        ]
    }), 200


# =========================================================
# GET BESTSELLING PRODUCTS
# GET /api/products/bestsellers
# =========================================================
@product_bp.route("/bestsellers", methods=["GET"])
def get_bestselling_products_route():

    products = get_bestselling_products()

    return jsonify({
        "products": [
            {
                **product_to_dict(product),
                "sold_quantity": int(sold_quantity)
            }
            for product, sold_quantity in products
        ]
    }), 200


# =========================================================
# GET ALL PRODUCTS FOR ADMIN
# GET /api/products/admin
# =========================================================
@product_bp.route("/admin", methods=["GET"])
@admin_required
def get_admin_products():

    products = get_all_products(
        active_only=False
    )

    return jsonify({
        "products": [
            product_to_dict(product)
            for product in products
        ]
    }), 200


# =========================================================
# GET SINGLE PRODUCT
# GET /api/products/<id>
# =========================================================
@product_bp.route("/<int:product_id>", methods=["GET"])
def get_product(product_id):

    product = get_product_by_id(
        product_id
    )

    if not product or not product.is_active:
        return jsonify({
            "message": "Product not found"
        }), 404

    return jsonify({
        "product": product_to_dict(product)
    }), 200


@product_bp.route(
    "/<int:product_id>/related",
    methods=["GET"]
)
def get_related_products_route(product_id):
    products = get_related_products(product_id)

    if products is None:
        return jsonify({
            "message": "Product not found"
        }), 404

    return jsonify({
        "products": [
            product_to_dict(product)
            for product in products
        ]
    }), 200


# =========================================================
# CREATE PRODUCT
# POST /api/products
# =========================================================
@product_bp.route("", methods=["POST"])
@admin_required
def create_product():

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    category_id = data.get("category_id")
    name = data.get("name", "").strip()
    description = data.get("description")
    price = data.get("price")
    stock_quantity = data.get(
        "stock_quantity",
        0
    )
    image_url = data.get("image_url")
    is_active = data.get("is_active", True)

    product, error = create_product_service(
        category_id=category_id,
        name=name,
        description=description,
        price=price,
        stock_quantity=stock_quantity,
        image_url=image_url,
        is_active=is_active
    )

    if error:

        if error == "Category not found":
            return jsonify({
                "message": error
            }), 404

        if error == "Product already exists":
            return jsonify({
                "message": error
            }), 409

        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Product created successfully",
        "product": product_to_dict(product)
    }), 201


# =========================================================
# UPDATE PRODUCT
# PUT /api/products/<id>
# =========================================================
@product_bp.route("/<int:product_id>", methods=["PUT"])
@admin_required
def update_product(product_id):

    product = get_product_by_id(
        product_id
    )

    if not product:
        return jsonify({
            "message": "Product not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    product, error = update_product_service(
        product=product,

        category_id=(
            data.get("category_id")
            if "category_id" in data
            else None
        ),

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

        price=(
            data.get("price")
            if "price" in data
            else None
        ),

        stock_quantity=(
            data.get("stock_quantity")
            if "stock_quantity" in data
            else None
        ),

        image_url=(
            data.get("image_url")
            if "image_url" in data
            else None
        ),

        is_active=(
            data.get("is_active")
            if "is_active" in data
            else None
        )
    )

    if error:

        if error == "Category not found":
            return jsonify({
                "message": error
            }), 404

        if error == "Product already exists":
            return jsonify({
                "message": error
            }), 409

        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Product updated successfully",
        "product": product_to_dict(product)
    }), 200


# =========================================================
# DELETE PRODUCT
# DELETE /api/products/<id>
# =========================================================
@product_bp.route("/<int:product_id>", methods=["DELETE"])
@admin_required
def delete_product(product_id):

    product = get_product_by_id(
        product_id
    )

    if not product:
        return jsonify({
            "message": "Product not found"
        }), 404

    delete_product_service(product)

    return jsonify({
        "message": "Product deleted successfully"
    }), 200
