# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from datetime import datetime

# from extensions import db
# from models.address import Address


# address_bp = Blueprint(
#     "address",
#     __name__,
#     url_prefix="/api/addresses"
# )


# # =========================================================
# # GET ALL ADDRESSES
# # =========================================================
# @address_bp.route("", methods=["GET"])
# @jwt_required()
# def get_addresses():

#     user_id = int(get_jwt_identity())

#     addresses = Address.query.filter_by(
#         user_id=user_id
#     ).order_by(
#         Address.is_default.desc(),
#         Address.created_at.desc()
#     ).all()

#     result = []

#     for address in addresses:
#         result.append({
#             "id": address.id,
#             "full_name": address.full_name,
#             "phone": address.phone,
#             "address_line1": address.address_line1,
#             "address_line2": address.address_line2,
#             "city": address.city,
#             "state": address.state,
#             "postal_code": address.postal_code,
#             "country": address.country,
#             "address_type": address.address_type,
#             "is_default": address.is_default,
#             "created_at": address.created_at.isoformat()
#             if address.created_at else None
#         })

#     return jsonify({
#         "addresses": result
#     }), 200


# # =========================================================
# # GET SINGLE ADDRESS
# # =========================================================
# @address_bp.route("/<int:address_id>", methods=["GET"])
# @jwt_required()
# def get_address(address_id):

#     user_id = int(get_jwt_identity())

#     address = Address.query.filter_by(
#         id=address_id,
#         user_id=user_id
#     ).first()

#     if not address:
#         return jsonify({
#             "message": "Address not found"
#         }), 404

#     return jsonify({
#         "address": {
#             "id": address.id,
#             "full_name": address.full_name,
#             "phone": address.phone,
#             "address_line1": address.address_line1,
#             "address_line2": address.address_line2,
#             "city": address.city,
#             "state": address.state,
#             "postal_code": address.postal_code,
#             "country": address.country,
#             "address_type": address.address_type,
#             "is_default": address.is_default
#         }
#     }), 200


# # =========================================================
# # ADD ADDRESS
# # =========================================================
# @address_bp.route("", methods=["POST"])
# @jwt_required()
# def add_address():

#     user_id = int(get_jwt_identity())

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     full_name = data.get("full_name", "").strip()
#     phone = data.get("phone", "").strip()
#     address_line1 = data.get("address_line1", "").strip()
#     address_line2 = data.get("address_line2")
#     city = data.get("city", "").strip()
#     state = data.get("state", "").strip()
#     postal_code = data.get("postal_code", "").strip()
#     country = data.get("country", "India").strip()
#     address_type = data.get("address_type", "home").strip().lower()
#     is_default = data.get("is_default", False)

#     # Required fields
#     if not full_name:
#         return jsonify({
#             "message": "Full name is required"
#         }), 400

#     if not phone:
#         return jsonify({
#             "message": "Phone is required"
#         }), 400

#     if not address_line1:
#         return jsonify({
#             "message": "Address line 1 is required"
#         }), 400

#     if not city:
#         return jsonify({
#             "message": "City is required"
#         }), 400

#     if not state:
#         return jsonify({
#             "message": "State is required"
#         }), 400

#     if not postal_code:
#         return jsonify({
#             "message": "Postal code is required"
#         }), 400

#     if address_type not in ["home", "work", "other"]:
#         return jsonify({
#             "message": "Address type must be home, work or other"
#         }), 400

#     # If this is the first address, make it default
#     existing_count = Address.query.filter_by(
#         user_id=user_id
#     ).count()

#     if existing_count == 0:
#         is_default = True

#     # If new address is default, remove old default
#     if is_default:
#         Address.query.filter_by(
#             user_id=user_id,
#             is_default=True
#         ).update({
#             "is_default": False
#         })

#     address = Address(
#         user_id=user_id,
#         full_name=full_name,
#         phone=phone,
#         address_line1=address_line1,
#         address_line2=address_line2,
#         city=city,
#         state=state,
#         postal_code=postal_code,
#         country=country,
#         address_type=address_type,
#         is_default=is_default,
#         created_at=datetime.utcnow(),
#         updated_at=datetime.utcnow()
#     )

#     db.session.add(address)
#     db.session.commit()

#     return jsonify({
#         "message": "Address added successfully",
#         "address": {
#             "id": address.id,
#             "full_name": address.full_name,
#             "phone": address.phone,
#             "address_line1": address.address_line1,
#             "address_line2": address.address_line2,
#             "city": address.city,
#             "state": address.state,
#             "postal_code": address.postal_code,
#             "country": address.country,
#             "address_type": address.address_type,
#             "is_default": address.is_default
#         }
#     }), 201


# # =========================================================
# # UPDATE ADDRESS
# # =========================================================
# @address_bp.route("/<int:address_id>", methods=["PUT"])
# @jwt_required()
# def update_address(address_id):

#     user_id = int(get_jwt_identity())

#     address = Address.query.filter_by(
#         id=address_id,
#         user_id=user_id
#     ).first()

#     if not address:
#         return jsonify({
#             "message": "Address not found"
#         }), 404

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     address.full_name = data.get(
#         "full_name",
#         address.full_name
#     ).strip()

#     address.phone = data.get(
#         "phone",
#         address.phone
#     ).strip()

#     address.address_line1 = data.get(
#         "address_line1",
#         address.address_line1
#     ).strip()

#     address.address_line2 = data.get(
#         "address_line2",
#         address.address_line2
#     )

#     address.city = data.get(
#         "city",
#         address.city
#     ).strip()

#     address.state = data.get(
#         "state",
#         address.state
#     ).strip()

#     address.postal_code = data.get(
#         "postal_code",
#         address.postal_code
#     ).strip()

#     address.country = data.get(
#         "country",
#         address.country
#     ).strip()

#     address_type = data.get(
#         "address_type",
#         address.address_type
#     ).strip().lower()

#     if address_type not in ["home", "work", "other"]:
#         return jsonify({
#             "message": "Address type must be home, work or other"
#         }), 400

#     address.address_type = address_type

#     if data.get("is_default") is True:

#         Address.query.filter_by(
#             user_id=user_id,
#             is_default=True
#         ).update({
#             "is_default": False
#         })

#         address.is_default = True

#     elif data.get("is_default") is False:

#         address.is_default = False

#     address.updated_at = datetime.utcnow()

#     db.session.commit()

#     return jsonify({
#         "message": "Address updated successfully"
#     }), 200


# # =========================================================
# # SET DEFAULT ADDRESS
# # =========================================================
# @address_bp.route("/<int:address_id>/default", methods=["PUT"])
# @jwt_required()
# def set_default_address(address_id):

#     user_id = int(get_jwt_identity())

#     address = Address.query.filter_by(
#         id=address_id,
#         user_id=user_id
#     ).first()

#     if not address:
#         return jsonify({
#             "message": "Address not found"
#         }), 404

#     # Remove existing default
#     Address.query.filter_by(
#         user_id=user_id,
#         is_default=True
#     ).update({
#         "is_default": False
#     })

#     address.is_default = True
#     address.updated_at = datetime.utcnow()

#     db.session.commit()

#     return jsonify({
#         "message": "Default address updated successfully"
#     }), 200


# # =========================================================
# # DELETE ADDRESS
# # =========================================================
# @address_bp.route("/<int:address_id>", methods=["DELETE"])
# @jwt_required()
# def delete_address(address_id):

#     user_id = int(get_jwt_identity())

#     address = Address.query.filter_by(
#         id=address_id,
#         user_id=user_id
#     ).first()

#     if not address:
#         return jsonify({
#             "message": "Address not found"
#         }), 404

#     was_default = address.is_default

#     db.session.delete(address)
#     db.session.commit()

#     # If deleted address was default,
#     # make another address default
#     if was_default:

#         next_address = Address.query.filter_by(
#             user_id=user_id
#         ).order_by(
#             Address.created_at.desc()
#         ).first()

#         if next_address:
#             next_address.is_default = True
#             db.session.commit()

#     return jsonify({
#         "message": "Address deleted successfully"
#     }), 200

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from services.address_service import (
    get_user_addresses,
    get_address_by_id,
    create_address as create_address_service,
    update_address as update_address_service,
    set_default_address as set_default_address_service,
    delete_address as delete_address_service
)


address_bp = Blueprint(
    "address",
    __name__,
    url_prefix="/api/addresses"
)


# =========================================================
# HELPER
# =========================================================
def address_to_dict(address, include_created_at=False):
    data = {
        "id": address.id,
        "full_name": address.full_name,
        "phone": address.phone,
        "address_line1": address.address_line1,
        "address_line2": address.address_line2,
        "city": address.city,
        "state": address.state,
        "postal_code": address.postal_code,
        "country": address.country,
        "address_type": address.address_type,
        "is_default": address.is_default
    }

    if include_created_at:
        data["created_at"] = (
            address.created_at.isoformat()
            if address.created_at
            else None
        )

    return data


# =========================================================
# GET ALL ADDRESSES
# GET /api/addresses
# =========================================================
@address_bp.route("", methods=["GET"])
@jwt_required()
def get_addresses():

    user_id = int(get_jwt_identity())

    addresses = get_user_addresses(user_id)

    return jsonify({
        "addresses": [
            address_to_dict(
                address,
                include_created_at=True
            )
            for address in addresses
        ]
    }), 200


# =========================================================
# GET SINGLE ADDRESS
# GET /api/addresses/<address_id>
# =========================================================
@address_bp.route(
    "/<int:address_id>",
    methods=["GET"]
)
@jwt_required()
def get_address(address_id):

    user_id = int(get_jwt_identity())

    address = get_address_by_id(
        user_id,
        address_id
    )

    if not address:
        return jsonify({
            "message": "Address not found"
        }), 404

    return jsonify({
        "address": address_to_dict(address)
    }), 200


# =========================================================
# ADD ADDRESS
# POST /api/addresses
# =========================================================
@address_bp.route("", methods=["POST"])
@jwt_required()
def add_address():

    user_id = int(get_jwt_identity())

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    full_name = data.get(
        "full_name",
        ""
    ).strip()

    phone = data.get(
        "phone",
        ""
    ).strip()

    address_line1 = data.get(
        "address_line1",
        ""
    ).strip()

    address_line2 = data.get(
        "address_line2"
    )

    city = data.get(
        "city",
        ""
    ).strip()

    state = data.get(
        "state",
        ""
    ).strip()

    postal_code = data.get(
        "postal_code",
        ""
    ).strip()

    country = data.get(
        "country",
        "India"
    ).strip()

    address_type = data.get(
        "address_type",
        "home"
    ).strip().lower()

    is_default = data.get(
        "is_default",
        False
    )

    address, error = create_address_service(
        user_id=user_id,
        full_name=full_name,
        phone=phone,
        address_line1=address_line1,
        address_line2=address_line2,
        city=city,
        state=state,
        postal_code=postal_code,
        country=country,
        address_type=address_type,
        is_default=is_default
    )

    if error:
        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Address added successfully",
        "address": address_to_dict(address)
    }), 201


# =========================================================
# UPDATE ADDRESS
# PUT /api/addresses/<address_id>
# =========================================================
@address_bp.route(
    "/<int:address_id>",
    methods=["PUT"]
)
@jwt_required()
def update_address(address_id):

    user_id = int(get_jwt_identity())

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    address, error = update_address_service(
        user_id=user_id,
        address_id=address_id,
        full_name=(
            data.get("full_name")
            if "full_name" in data
            else None
        ),
        phone=(
            data.get("phone")
            if "phone" in data
            else None
        ),
        address_line1=(
            data.get("address_line1")
            if "address_line1" in data
            else None
        ),
        address_line2=(
            data.get("address_line2")
            if "address_line2" in data
            else None
        ),
        city=(
            data.get("city")
            if "city" in data
            else None
        ),
        state=(
            data.get("state")
            if "state" in data
            else None
        ),
        postal_code=(
            data.get("postal_code")
            if "postal_code" in data
            else None
        ),
        country=(
            data.get("country")
            if "country" in data
            else None
        ),
        address_type=(
            data.get("address_type")
            if "address_type" in data
            else None
        ),
        is_default=(
            data.get("is_default")
            if "is_default" in data
            else None
        )
    )

    if error:

        if error == "Address not found":
            return jsonify({
                "message": error
            }), 404

        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Address updated successfully"
    }), 200


# =========================================================
# SET DEFAULT ADDRESS
# PUT /api/addresses/<address_id>/default
# =========================================================
@address_bp.route(
    "/<int:address_id>/default",
    methods=["PUT"]
)
@jwt_required()
def set_default_address(address_id):

    user_id = int(get_jwt_identity())

    address, error = set_default_address_service(
        user_id=user_id,
        address_id=address_id
    )

    if error:
        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "message": "Default address updated successfully"
    }), 200


# =========================================================
# DELETE ADDRESS
# DELETE /api/addresses/<address_id>
# =========================================================
@address_bp.route(
    "/<int:address_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_address(address_id):

    user_id = int(get_jwt_identity())

    result, error = delete_address_service(
        user_id=user_id,
        address_id=address_id
    )

    if error:
        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "message": "Address deleted successfully"
    }), 200