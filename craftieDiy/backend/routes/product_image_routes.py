from flask import Blueprint, request, jsonify, current_app

import os
import re

import cloudinary
import cloudinary.uploader

from middleware.admin_required import admin_required

from services.product_image_service import (
    get_product_images as get_product_images_service,
    get_product_image_by_id,
    create_product_image,
    update_product_image as update_product_image_service,
    delete_product_image as delete_product_image_service,
)


# =========================================================
# CLOUDINARY CONFIGURATION
# Values come from backend/.env (local) or
# Render Environment Variables (production)
# =========================================================

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

CLOUDINARY_FOLDER = "craftiediy/products"


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
    if not filename or "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[-1].lower()

    return extension in ALLOWED_EXTENSIONS


def get_cloudinary_public_id(image_url):
    """
    Extract the Cloudinary public_id from a Cloudinary URL.

    Example:
    https://res.cloudinary.com/qwtikzqt/image/upload/v123/craftiediy/products/abc.png
    -> craftiediy/products/abc

    Returns None for non-Cloudinary URLs (old localhost URLs, etc.)
    """
    if not image_url or "res.cloudinary.com" not in image_url:
        return None

    if "/upload/" not in image_url:
        return None

    path = image_url.split("/upload/", 1)[1]

    # remove version part like v1712345678/
    path = re.sub(r"^v\d+/", "", path)

    # remove file extension
    path = path.rsplit(".", 1)[0] if "." in path else path

    return path or None


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
    # CHECK CLOUDINARY CONFIG
    # -----------------------------------------------------

    if not (
        os.getenv("CLOUDINARY_CLOUD_NAME")
        and os.getenv("CLOUDINARY_API_KEY")
        and os.getenv("CLOUDINARY_API_SECRET")
    ):

        current_app.logger.error(
            "Cloudinary environment variables are missing"
        )

        return jsonify({
            "message": "Image storage is not configured"
        }), 500

    # -----------------------------------------------------
    # UPLOAD TO CLOUDINARY
    # -----------------------------------------------------

    try:

        upload_result = cloudinary.uploader.upload(
            image_file,
            folder=CLOUDINARY_FOLDER,
            resource_type="image"
        )

    except Exception:

        current_app.logger.exception(
            "Cloudinary upload failed"
        )

        return jsonify({
            "message": "Image upload failed"
        }), 500

    image_url = upload_result["secure_url"]
    public_id = upload_result["public_id"]

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

        # Remove uploaded image from Cloudinary if DB operation fails

        try:
            cloudinary.uploader.destroy(public_id)
        except Exception:
            current_app.logger.exception(
                "Cloudinary cleanup failed"
            )

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

    # Also remove the file from Cloudinary (if it is a Cloudinary image)

    public_id = get_cloudinary_public_id(
        image.image_url
    )

    delete_product_image_service(
        image
    )

    if public_id:

        try:
            cloudinary.uploader.destroy(public_id)
        except Exception:
            current_app.logger.exception(
                "Cloudinary delete failed"
            )

    return jsonify({
        "message": "Product image deleted successfully"
    }), 200