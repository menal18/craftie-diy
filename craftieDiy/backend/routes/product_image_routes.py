# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required

# from extensions import db
# from models.product_image import ProductImage
# from models.product import Product


# product_image_bp = Blueprint(
#     "product_image",
#     __name__,
#     url_prefix="/api/product-images"
# )


# # =========================================================
# # GET IMAGES FOR A PRODUCT
# # GET /api/product-images/product/<product_id>
# # =========================================================
# @product_image_bp.route("/product/<int:product_id>", methods=["GET"])
# def get_product_images(product_id):

#     product = Product.query.get(product_id)

#     if not product or not product.is_active:
#         return jsonify({
#             "message": "Product not found"
#         }), 404

#     images = ProductImage.query.filter_by(
#         product_id=product_id
#     ).order_by(
#         ProductImage.display_order.asc()
#     ).all()

#     return jsonify({
#         "images": [
#             {
#                 "id": image.id,
#                 "product_id": image.product_id,
#                 "image_url": image.image_url,
#                 "is_primary": image.is_primary,
#                 "display_order": image.display_order,
#                 "created_at": (
#                     image.created_at.isoformat()
#                     if image.created_at
#                     else None
#                 )
#             }
#             for image in images
#         ]
#     }), 200


# # =========================================================
# # ADD PRODUCT IMAGE
# # POST /api/product-images
# # =========================================================
# @product_image_bp.route("", methods=["POST"])
# @jwt_required()
# def add_product_image():

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     product_id = data.get("product_id")
#     image_url = data.get("image_url", "").strip()
#     is_primary = data.get("is_primary", False)
#     display_order = data.get("display_order", 0)

#     if not product_id:
#         return jsonify({
#             "message": "Product ID is required"
#         }), 400

#     if not image_url:
#         return jsonify({
#             "message": "Image URL is required"
#         }), 400

#     product = Product.query.get(product_id)

#     if not product or not product.is_active:
#         return jsonify({
#             "message": "Product not found"
#         }), 404

#     try:
#         display_order = int(display_order)
#     except (ValueError, TypeError):
#         return jsonify({
#             "message": "Invalid display order"
#         }), 400

#     # If this image is primary, remove primary status
#     # from existing images of the same product.
#     if is_primary:
#         ProductImage.query.filter_by(
#             product_id=product_id
#         ).update({
#             "is_primary": False
#         })

#     image = ProductImage(
#         product_id=product_id,
#         image_url=image_url,
#         is_primary=bool(is_primary),
#         display_order=display_order
#     )

#     db.session.add(image)
#     db.session.commit()

#     return jsonify({
#         "message": "Product image added successfully",
#         "image": {
#             "id": image.id,
#             "product_id": image.product_id,
#             "image_url": image.image_url,
#             "is_primary": image.is_primary,
#             "display_order": image.display_order
#         }
#     }), 201


# # =========================================================
# # UPDATE PRODUCT IMAGE
# # PUT /api/product-images/<id>
# # =========================================================
# @product_image_bp.route("/<int:image_id>", methods=["PUT"])
# @jwt_required()
# def update_product_image(image_id):

#     image = ProductImage.query.get(image_id)

#     if not image:
#         return jsonify({
#             "message": "Product image not found"
#         }), 404

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     if "image_url" in data:

#         image_url = data["image_url"].strip()

#         if not image_url:
#             return jsonify({
#                 "message": "Image URL cannot be empty"
#             }), 400

#         image.image_url = image_url

#     if "display_order" in data:

#         try:
#             image.display_order = int(data["display_order"])
#         except (ValueError, TypeError):
#             return jsonify({
#                 "message": "Invalid display order"
#             }), 400

#     if data.get("is_primary") is True:

#         ProductImage.query.filter(
#             ProductImage.product_id == image.product_id,
#             ProductImage.id != image_id
#         ).update({
#             "is_primary": False
#         })

#         image.is_primary = True

#     elif "is_primary" in data:
#         image.is_primary = False

#     db.session.commit()

#     return jsonify({
#         "message": "Product image updated successfully",
#         "image": {
#             "id": image.id,
#             "product_id": image.product_id,
#             "image_url": image.image_url,
#             "is_primary": image.is_primary,
#             "display_order": image.display_order
#         }
#     }), 200


# # =========================================================
# # DELETE PRODUCT IMAGE
# # DELETE /api/product-images/<id>
# # =========================================================
# @product_image_bp.route("/<int:image_id>", methods=["DELETE"])
# @jwt_required()
# def delete_product_image(image_id):

#     image = ProductImage.query.get(image_id)

#     if not image:
#         return jsonify({
#             "message": "Product image not found"
#         }), 404

#     db.session.delete(image)
#     db.session.commit()

#     return jsonify({
#         "message": "Product image deleted successfully"
#     }), 200

# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required
# from middleware.admin_required import admin_required

# from models.product_image import ProductImage

# from services.product_image_service import (
#     get_product_images as get_product_images_service,
#     get_product_image_by_id,
#     create_product_image,
#     update_product_image as update_product_image_service,
#     delete_product_image as delete_product_image_service,
# )


# product_image_bp = Blueprint(
#     "product_image",
#     __name__,
#     url_prefix="/api/product-images"
# )


# # =========================================================
# # HELPER
# # =========================================================
# def product_image_to_dict(image):
#     return {
#         "id": image.id,
#         "product_id": image.product_id,
#         "image_url": image.image_url,
#         "is_primary": image.is_primary,
#         "display_order": image.display_order,
#         "created_at": (
#             image.created_at.isoformat()
#             if image.created_at
#             else None
#         )
#     }


# # =========================================================
# # GET IMAGES FOR A PRODUCT
# # GET /api/product-images/product/<product_id>
# # =========================================================
# @product_image_bp.route(
#     "/product/<int:product_id>",
#     methods=["GET"]
# )
# def get_product_images(product_id):

#     images, error = get_product_images_service(product_id)

#     if error:
#         return jsonify({
#             "message": error
#         }), 404

#     return jsonify({
#         "images": [
#             product_image_to_dict(image)
#             for image in images
#         ]
#     }), 200


# # =========================================================
# # ADD PRODUCT IMAGE
# # POST /api/product-images
# # =========================================================
# @product_image_bp.route("", methods=["POST"])
# @admin_required
# def add_product_image():

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     product_id = data.get("product_id")
#     image_url = data.get("image_url", "").strip()
#     is_primary = data.get("is_primary", False)
#     display_order = data.get("display_order", 0)

#     if not product_id:
#         return jsonify({
#             "message": "Product ID is required"
#         }), 400

#     if not image_url:
#         return jsonify({
#             "message": "Image URL is required"
#         }), 400

#     image, error = create_product_image(
#         product_id=product_id,
#         image_url=image_url,
#         is_primary=is_primary,
#         display_order=display_order
#     )

#     if error:
#         if error == "Product not found":
#             return jsonify({
#                 "message": error
#             }), 404

#         return jsonify({
#             "message": error
#         }), 400

#     return jsonify({
#         "message": "Product image added successfully",
#         "image": product_image_to_dict(image)
#     }), 201


# # =========================================================
# # UPDATE PRODUCT IMAGE
# # PUT /api/product-images/<id>
# # =========================================================
# @product_image_bp.route(
#     "/<int:image_id>",
#     methods=["PUT"]
# )
# @admin_required
# def update_product_image(image_id):

#     image = get_product_image_by_id(image_id)

#     if not image:
#         return jsonify({
#             "message": "Product image not found"
#         }), 404

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     image_url = data.get("image_url") if "image_url" in data else None
#     is_primary = data.get("is_primary") if "is_primary" in data else None
#     display_order = (
#         data.get("display_order")
#         if "display_order" in data
#         else None
#     )

#     if image_url is not None:
#         image_url = image_url.strip()

#     updated_image, error = update_product_image_service(
#         image=image,
#         image_url=image_url,
#         is_primary=is_primary,
#         display_order=display_order
#     )

#     if error:
#         return jsonify({
#             "message": error
#         }), 400

#     return jsonify({
#         "message": "Product image updated successfully",
#         "image": product_image_to_dict(updated_image)
#     }), 200


# # =========================================================
# # DELETE PRODUCT IMAGE
# # DELETE /api/product-images/<id>
# # =========================================================
# @product_image_bp.route(
#     "/<int:image_id>",
#     methods=["DELETE"]
# )
# @admin_required
# def delete_product_image(image_id):

#     image = get_product_image_by_id(image_id)

#     if not image:
#         return jsonify({
#             "message": "Product image not found"
#         }), 404

#     delete_product_image_service(image)

#     return jsonify({
#         "message": "Product image deleted successfully"
#     }), 200

from flask import Blueprint, request, jsonify, url_for
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required

import os
import uuid

from middleware.admin_required import admin_required

from models.product_image import ProductImage

from services.product_image_service import (
    get_product_images as get_product_images_service,
    get_product_image_by_id,
    create_product_image,
    update_product_image as update_product_image_service,
    delete_product_image as delete_product_image_service,
)


product_image_bp = Blueprint(
    "product_image",
    __name__,
    url_prefix="/api/product-images"
)


# =========================================================
# IMAGE CONFIGURATION
# =========================================================

ALLOWED_EXTENSIONS = {
    "png",
    "jpg",
    "jpeg",
    "webp"
}


def allowed_file(filename):
    if not filename:
        return False

    extension = filename.rsplit(".", 1)[-1].lower()

    return extension in ALLOWED_EXTENSIONS


# =========================================================
# HELPER
# =========================================================

def product_image_to_dict(image):

    return {
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


# =========================================================
# GET IMAGES FOR PRODUCT
# GET /api/product-images/product/<product_id>
# =========================================================

@product_image_bp.route(
    "/product/<int:product_id>",
    methods=["GET"]
)
def get_product_images(product_id):

    images, error = get_product_images_service(
        product_id
    )

    if error:
        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "images": [
            product_image_to_dict(image)
            for image in images
        ]
    }), 200


# =========================================================
# ADD PRODUCT IMAGE
# POST /api/product-images
#
# multipart/form-data
#
# product_id
# image
# is_primary
# display_order
# =========================================================

@product_image_bp.route(
    "",
    methods=["POST"]
)
@admin_required
def add_product_image():

    product_id = request.form.get("product_id")

    image_file = request.files.get("image")

    is_primary = (
        request.form.get(
            "is_primary",
            "false"
        ).lower() == "true"
    )

    display_order = request.form.get(
        "display_order",
        0
    )

    # -----------------------------------------------------
    # VALIDATE PRODUCT ID
    # -----------------------------------------------------

    if not product_id:

        return jsonify({
            "message": "Product ID is required"
        }), 400

    try:

        product_id = int(product_id)

    except (ValueError, TypeError):

        return jsonify({
            "message": "Invalid product ID"
        }), 400

    # -----------------------------------------------------
    # VALIDATE IMAGE
    # -----------------------------------------------------

    if not image_file:

        return jsonify({
            "message": "Image file is required"
        }), 400

    if not image_file.filename:

        return jsonify({
            "message": "Image file name is required"
        }), 400

    if not allowed_file(image_file.filename):

        return jsonify({
            "message": (
                "Invalid image format. "
                "Allowed formats: PNG, JPG, JPEG, WEBP"
            )
        }), 400

    # -----------------------------------------------------
    # CREATE UPLOAD DIRECTORY
    # -----------------------------------------------------

    upload_folder = os.path.join(
        os.path.dirname(
            os.path.dirname(
                os.path.abspath(__file__)
            )
        ),
        "static",
        "uploads",
        "products"
    )

    os.makedirs(
        upload_folder,
        exist_ok=True
    )

    # -----------------------------------------------------
    # CREATE UNIQUE FILE NAME
    # -----------------------------------------------------

    original_name = secure_filename(
        image_file.filename
    )

    extension = original_name.rsplit(
        ".",
        1
    )[-1].lower()

    unique_filename = (
        f"{uuid.uuid4().hex}.{extension}"
    )

    file_path = os.path.join(
        upload_folder,
        unique_filename
    )

    # -----------------------------------------------------
    # SAVE IMAGE
    # -----------------------------------------------------

    image_file.save(file_path)

    # -----------------------------------------------------
    # CREATE IMAGE URL
    # -----------------------------------------------------

    image_url = url_for(
        "static",
        filename=f"uploads/products/{unique_filename}",
        _external=True
    )

    # -----------------------------------------------------
    # SAVE DATABASE RECORD
    # -----------------------------------------------------

    image, error = create_product_image(
        product_id=product_id,
        image_url=image_url,
        is_primary=is_primary,
        display_order=display_order
    )

    if error:

        # Remove uploaded file if DB operation fails

        if os.path.exists(file_path):
            os.remove(file_path)

        if error == "Product not found":

            return jsonify({
                "message": error
            }), 404

        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Product image uploaded successfully",
        "image": product_image_to_dict(image)
    }), 201


# =========================================================
# UPDATE PRODUCT IMAGE
# PUT /api/product-images/<id>
# =========================================================

@product_image_bp.route(
    "/<int:image_id>",
    methods=["PUT"]
)
@admin_required
def update_product_image(image_id):

    image = get_product_image_by_id(
        image_id
    )

    if not image:

        return jsonify({
            "message": "Product image not found"
        }), 404

    data = request.get_json()

    if not data:

        return jsonify({
            "message": "Request body is required"
        }), 400

    image_url = (
        data.get("image_url")
        if "image_url" in data
        else None
    )

    is_primary = (
        data.get("is_primary")
        if "is_primary" in data
        else None
    )

    display_order = (
        data.get("display_order")
        if "display_order" in data
        else None
    )

    if image_url is not None:
        image_url = image_url.strip()

    updated_image, error = (
        update_product_image_service(
            image=image,
            image_url=image_url,
            is_primary=is_primary,
            display_order=display_order
        )
    )

    if error:

        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Product image updated successfully",
        "image": product_image_to_dict(
            updated_image
        )
    }), 200


# =========================================================
# DELETE PRODUCT IMAGE
# DELETE /api/product-images/<id>
# =========================================================

@product_image_bp.route(
    "/<int:image_id>",
    methods=["DELETE"]
)
@admin_required
def delete_product_image(image_id):

    image = get_product_image_by_id(
        image_id
    )

    if not image:

        return jsonify({
            "message": "Product image not found"
        }), 404

    delete_product_image_service(
        image
    )

    return jsonify({
        "message": "Product image deleted successfully"
    }), 200