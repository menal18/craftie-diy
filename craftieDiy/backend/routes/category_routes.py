# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required

# from extensions import db
# from models.category import Category


# category_bp = Blueprint(
#     "category",
#     __name__,
#     url_prefix="/api/categories"
# )


# # =========================================================
# # GET ALL ACTIVE CATEGORIES
# # GET /api/categories
# # =========================================================
# @category_bp.route("", methods=["GET"])
# def get_categories():

#     categories = Category.query.filter_by(
#         is_active=True
#     ).order_by(Category.name.asc()).all()

#     return jsonify({
#         "categories": [
#             {
#                 "id": category.id,
#                 "name": category.name,
#                 "description": category.description,
#                 "image_url": category.image_url,
#                 "is_active": category.is_active,
#                 "created_at": (
#                     category.created_at.isoformat()
#                     if category.created_at
#                     else None
#                 )
#             }
#             for category in categories
#         ]
#     }), 200


# # =========================================================
# # GET SINGLE CATEGORY
# # GET /api/categories/<id>
# # =========================================================
# @category_bp.route("/<int:category_id>", methods=["GET"])
# def get_category(category_id):

#     category = Category.query.get(category_id)

#     if not category or not category.is_active:
#         return jsonify({
#             "message": "Category not found"
#         }), 404

#     return jsonify({
#         "category": {
#             "id": category.id,
#             "name": category.name,
#             "description": category.description,
#             "image_url": category.image_url,
#             "is_active": category.is_active,
#             "created_at": (
#                 category.created_at.isoformat()
#                 if category.created_at
#                 else None
#             )
#         }
#     }), 200


# # =========================================================
# # CREATE CATEGORY
# # POST /api/categories
# # =========================================================
# @category_bp.route("", methods=["POST"])
# @jwt_required()
# def create_category():

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     name = data.get("name", "").strip()
#     description = data.get("description")
#     image_url = data.get("image_url")

#     if not name:
#         return jsonify({
#             "message": "Category name is required"
#         }), 400

#     existing_category = Category.query.filter_by(
#         name=name
#     ).first()

#     if existing_category:
#         return jsonify({
#             "message": "Category already exists"
#         }), 409

#     category = Category(
#         name=name,
#         description=description,
#         image_url=image_url,
#         is_active=True
#     )

#     db.session.add(category)
#     db.session.commit()

#     return jsonify({
#         "message": "Category created successfully",
#         "category": {
#             "id": category.id,
#             "name": category.name,
#             "description": category.description,
#             "image_url": category.image_url,
#             "is_active": category.is_active
#         }
#     }), 201


# # =========================================================
# # UPDATE CATEGORY
# # PUT /api/categories/<id>
# # =========================================================
# @category_bp.route("/<int:category_id>", methods=["PUT"])
# @jwt_required()
# def update_category(category_id):

#     category = Category.query.get(category_id)

#     if not category:
#         return jsonify({
#             "message": "Category not found"
#         }), 404

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     if "name" in data:
#         name = data["name"].strip()

#         if not name:
#             return jsonify({
#                 "message": "Category name cannot be empty"
#             }), 400

#         existing_category = Category.query.filter(
#             Category.name == name,
#             Category.id != category_id
#         ).first()

#         if existing_category:
#             return jsonify({
#                 "message": "Category name already exists"
#             }), 409

#         category.name = name

#     if "description" in data:
#         category.description = data["description"]

#     if "image_url" in data:
#         category.image_url = data["image_url"]

#     if "is_active" in data:
#         category.is_active = bool(data["is_active"])

#     db.session.commit()

#     return jsonify({
#         "message": "Category updated successfully",
#         "category": {
#             "id": category.id,
#             "name": category.name,
#             "description": category.description,
#             "image_url": category.image_url,
#             "is_active": category.is_active
#         }
#     }), 200


# # =========================================================
# # DELETE / DEACTIVATE CATEGORY
# # DELETE /api/categories/<id>
# # =========================================================
# @category_bp.route("/<int:category_id>", methods=["DELETE"])
# @jwt_required()
# def delete_category(category_id):

#     category = Category.query.get(category_id)

#     if not category:
#         return jsonify({
#             "message": "Category not found"
#         }), 404

#     # Soft delete
#     category.is_active = False

#     db.session.commit()

#     return jsonify({
#         "message": "Category deleted successfully"
#     }), 200

# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required
# from middleware.admin_required import admin_required

# from services.category_service import (
#     get_all_categories,
#     get_category_by_id,
#     create_category as create_category_service,
#     update_category as update_category_service,
#     delete_category as delete_category_service
# )


# category_bp = Blueprint(
#     "category",
#     __name__,
#     url_prefix="/api/categories"
# )


# # =========================================================
# # CATEGORY RESPONSE HELPER
# # =========================================================
# def category_to_dict(category):

#     return {
#         "id": category.id,
#         "name": category.name,
#         "description": category.description,
#         "image_url": category.image_url,
#         "is_active": category.is_active,
#         "created_at": (
#             category.created_at.isoformat()
#             if category.created_at
#             else None
#         )
#     }


# # =========================================================
# # GET ALL ACTIVE CATEGORIES
# # GET /api/categories
# # =========================================================
# @category_bp.route("", methods=["GET"])
# def get_categories():

#     categories = get_all_categories(
#         active_only=True
#     )

#     return jsonify({
#         "categories": [
#             category_to_dict(category)
#             for category in categories
#         ]
#     }), 200


# # =========================================================
# # GET SINGLE CATEGORY
# # GET /api/categories/<id>
# # =========================================================
# @category_bp.route("/<int:category_id>", methods=["GET"])
# def get_category(category_id):

#     category = get_category_by_id(
#         category_id
#     )

#     if not category or not category.is_active:
#         return jsonify({
#             "message": "Category not found"
#         }), 404

#     return jsonify({
#         "category": category_to_dict(category)
#     }), 200


# # =========================================================
# # CREATE CATEGORY
# # POST /api/categories
# # =========================================================
# @category_bp.route("", methods=["POST"])
# @admin_required
# def create_category():

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     name = data.get("name", "").strip()
#     description = data.get("description")
#     image_url = data.get("image_url")

#     category, error = create_category_service(
#         name=name,
#         description=description,
#         image_url=image_url
#     )

#     if error:

#         if error == "Category already exists":
#             return jsonify({
#                 "message": error
#             }), 409

#         return jsonify({
#             "message": error
#         }), 400

#     return jsonify({
#         "message": "Category created successfully",
#         "category": category_to_dict(category)
#     }), 201


# # =========================================================
# # UPDATE CATEGORY
# # PUT /api/categories/<id>
# # =========================================================
# @category_bp.route("/<int:category_id>", methods=["PUT"])
# @admin_required
# def update_category(category_id):

#     category = get_category_by_id(
#         category_id
#     )

#     if not category:
#         return jsonify({
#             "message": "Category not found"
#         }), 404

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     category, error = update_category_service(
#         category=category,
#         name=data.get("name") if "name" in data else None,
#         description=(
#             data.get("description")
#             if "description" in data
#             else None
#         ),
#         image_url=(
#             data.get("image_url")
#             if "image_url" in data
#             else None
#         ),
#         is_active=(
#             data.get("is_active")
#             if "is_active" in data
#             else None
#         )
#     )

#     if error:

#         if error == "Category already exists":
#             return jsonify({
#                 "message": "Category name already exists"
#             }), 409

#         return jsonify({
#             "message": error
#         }), 400

#     return jsonify({
#         "message": "Category updated successfully",
#         "category": category_to_dict(category)
#     }), 200


# # =========================================================
# # DELETE / DEACTIVATE CATEGORY
# # DELETE /api/categories/<id>
# # =========================================================
# @category_bp.route("/<int:category_id>", methods=["DELETE"])
# @admin_required
# def delete_category(category_id):

#     category = get_category_by_id(
#         category_id
#     )

#     if not category:
#         return jsonify({
#             "message": "Category not found"
#         }), 404

#     delete_category_service(category)

#     return jsonify({
#         "message": "Category deleted successfully"
#     }), 200

from flask import Blueprint, request, jsonify

from middleware.admin_required import admin_required

from services.category_service import (
    get_all_categories,
    get_category_by_id,
    create_category as create_category_service,
    update_category as update_category_service,
    delete_category as delete_category_service
)


category_bp = Blueprint(
    "category",
    __name__,
    url_prefix="/api/categories"
)


# =========================================================
# CATEGORY RESPONSE HELPER
# =========================================================
def category_to_dict(category):

    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "image_url": category.image_url,
        "is_active": category.is_active,
        "created_at": (
            category.created_at.isoformat()
            if category.created_at
            else None
        )
    }


# =========================================================
# CUSTOMER - GET ACTIVE CATEGORIES
# GET /api/categories
# =========================================================
@category_bp.route("", methods=["GET"])
def get_categories():

    categories = get_all_categories(
        active_only=True
    )

    return jsonify({
        "categories": [
            category_to_dict(category)
            for category in categories
        ]
    }), 200


# =========================================================
# ADMIN - GET ALL CATEGORIES
# GET /api/categories/admin
# =========================================================
@category_bp.route("/admin", methods=["GET"])
@admin_required
def get_admin_categories():

    categories = get_all_categories(
        active_only=False
    )

    return jsonify({
        "categories": [
            category_to_dict(category)
            for category in categories
        ]
    }), 200


# =========================================================
# GET SINGLE ACTIVE CATEGORY - CUSTOMER
# GET /api/categories/<id>
# =========================================================
@category_bp.route("/<int:category_id>", methods=["GET"])
def get_category(category_id):

    category = get_category_by_id(
        category_id
    )

    if not category or not category.is_active:
        return jsonify({
            "message": "Category not found"
        }), 404

    return jsonify({
        "category": category_to_dict(category)
    }), 200


# =========================================================
# CREATE CATEGORY
# POST /api/categories
# =========================================================
@category_bp.route("", methods=["POST"])
@admin_required
def create_category():

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    name = data.get("name", "").strip()
    description = data.get("description")
    image_url = data.get("image_url")

    is_active = data.get(
        "is_active",
        True
    )

    category, error = create_category_service(
        name=name,
        description=description,
        image_url=image_url,
        is_active=is_active
    )

    if error:

        if error == "Category already exists":
            return jsonify({
                "message": error
            }), 409

        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Category created successfully",
        "category": category_to_dict(category)
    }), 201


# =========================================================
# UPDATE CATEGORY
# PUT /api/categories/<id>
# =========================================================
@category_bp.route("/<int:category_id>", methods=["PUT"])
@admin_required
def update_category(category_id):

    category = get_category_by_id(
        category_id
    )

    if not category:
        return jsonify({
            "message": "Category not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    category, error = update_category_service(
        category=category,

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

        if error == "Category already exists":
            return jsonify({
                "message": "Category name already exists"
            }), 409

        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Category updated successfully",
        "category": category_to_dict(category)
    }), 200


# =========================================================
# DEACTIVATE CATEGORY
# DELETE /api/categories/<id>
# =========================================================
@category_bp.route("/<int:category_id>", methods=["DELETE"])
@admin_required
def delete_category(category_id):

    category = get_category_by_id(
        category_id
    )

    if not category:
        return jsonify({
            "message": "Category not found"
        }), 404

    delete_category_service(category)

    return jsonify({
        "message": "Category deactivated successfully",
        "category": category_to_dict(category)
    }), 200