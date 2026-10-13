# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from datetime import datetime
# from decimal import Decimal, InvalidOperation

# from extensions import db
# from models.promo_code import PromoCode
# from models.promo_code_usage import PromoCodeUsage
# from models.order import Order


# promo_code_bp = Blueprint(
#     "promo_code",
#     __name__,
#     url_prefix="/api/promo-codes"
# )


# # =========================================================
# # HELPER: Convert Promo Code to JSON
# # =========================================================
# def promo_code_to_dict(promo):

#     return {
#         "id": promo.id,
#         "code": promo.code,
#         "description": promo.description,
#         "discount_type": promo.discount_type,
#         "discount_value": float(promo.discount_value),
#         "minimum_order_value": float(promo.minimum_order_value),
#         "maximum_discount": (
#             float(promo.maximum_discount)
#             if promo.maximum_discount is not None
#             else None
#         ),
#         "usage_limit": promo.usage_limit,
#         "used_count": promo.used_count,
#         "start_date": (
#             promo.start_date.isoformat()
#             if promo.start_date
#             else None
#         ),
#         "end_date": (
#             promo.end_date.isoformat()
#             if promo.end_date
#             else None
#         ),
#         "is_active": promo.is_active,
#         "created_at": (
#             promo.created_at.isoformat()
#             if promo.created_at
#             else None
#         ),
#         "updated_at": (
#             promo.updated_at.isoformat()
#             if promo.updated_at
#             else None
#         )
#     }


# # =========================================================
# # HELPER: Parse Date
# # =========================================================
# def parse_datetime(value):

#     if not value:
#         return None

#     try:
#         return datetime.fromisoformat(
#             value.replace("Z", "+00:00")
#         )
#     except ValueError:
#         return None


# # =========================================================
# # GET ALL PROMO CODES
# # =========================================================
# @promo_code_bp.route("", methods=["GET"])
# @jwt_required()
# def get_promo_codes():

#     promo_codes = PromoCode.query.order_by(
#         PromoCode.created_at.desc()
#     ).all()

#     return jsonify({
#         "promo_codes": [
#             promo_code_to_dict(promo)
#             for promo in promo_codes
#         ]
#     }), 200


# # =========================================================
# # GET ACTIVE PROMO CODES
# # =========================================================
# @promo_code_bp.route("/active", methods=["GET"])
# def get_active_promo_codes():

#     now = datetime.utcnow()

#     promo_codes = PromoCode.query.filter(
#         PromoCode.is_active == True,
#         PromoCode.start_date <= now,
#         PromoCode.end_date >= now
#     ).order_by(
#         PromoCode.created_at.desc()
#     ).all()

#     return jsonify({
#         "promo_codes": [
#             promo_code_to_dict(promo)
#             for promo in promo_codes
#         ]
#     }), 200


# # =========================================================
# # GET SINGLE PROMO CODE
# # =========================================================
# @promo_code_bp.route("/<int:promo_id>", methods=["GET"])
# @jwt_required()
# def get_promo_code(promo_id):

#     promo = PromoCode.query.get(promo_id)

#     if not promo:
#         return jsonify({
#             "message": "Promo code not found"
#         }), 404

#     return jsonify({
#         "promo_code": promo_code_to_dict(promo)
#     }), 200


# # =========================================================
# # CREATE PROMO CODE
# # =========================================================
# @promo_code_bp.route("", methods=["POST"])
# @jwt_required()
# def create_promo_code():

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     code = data.get("code", "").strip().upper()
#     description = data.get("description")

#     discount_type = data.get(
#         "discount_type",
#         "percentage"
#     ).strip().lower()

#     discount_value = data.get("discount_value", 0)
#     minimum_order_value = data.get(
#         "minimum_order_value",
#         0
#     )
#     maximum_discount = data.get(
#         "maximum_discount"
#     )

#     usage_limit = data.get("usage_limit")

#     start_date = parse_datetime(
#         data.get("start_date")
#     )

#     end_date = parse_datetime(
#         data.get("end_date")
#     )

#     is_active = data.get(
#         "is_active",
#         True
#     )

#     # -----------------------------------------------------
#     # Validate code
#     # -----------------------------------------------------
#     if not code:
#         return jsonify({
#             "message": "Promo code is required"
#         }), 400

#     # -----------------------------------------------------
#     # Check duplicate
#     # -----------------------------------------------------
#     existing = PromoCode.query.filter_by(
#         code=code
#     ).first()

#     if existing:
#         return jsonify({
#             "message": "Promo code already exists"
#         }), 409

#     # -----------------------------------------------------
#     # Validate discount type
#     # -----------------------------------------------------
#     if discount_type not in [
#         "percentage",
#         "fixed"
#     ]:
#         return jsonify({
#             "message": "Discount type must be percentage or fixed"
#         }), 400

#     # -----------------------------------------------------
#     # Convert decimal values
#     # -----------------------------------------------------
#     try:
#         discount_value = Decimal(
#             str(discount_value)
#         )

#         minimum_order_value = Decimal(
#             str(minimum_order_value)
#         )

#         if maximum_discount is not None:
#             maximum_discount = Decimal(
#                 str(maximum_discount)
#             )

#     except (InvalidOperation, ValueError):
#         return jsonify({
#             "message": "Invalid discount value"
#         }), 400

#     # -----------------------------------------------------
#     # Validate discount
#     # -----------------------------------------------------
#     if discount_value <= 0:
#         return jsonify({
#             "message": "Discount value must be greater than 0"
#         }), 400

#     if discount_type == "percentage":

#         if discount_value > 100:
#             return jsonify({
#                 "message": "Percentage discount cannot exceed 100"
#             }), 400

#     if minimum_order_value < 0:
#         return jsonify({
#             "message": "Minimum order value cannot be negative"
#         }), 400

#     if maximum_discount is not None:

#         if maximum_discount <= 0:
#             return jsonify({
#                 "message": "Maximum discount must be greater than 0"
#             }), 400

#     # -----------------------------------------------------
#     # Validate dates
#     # -----------------------------------------------------
#     if not start_date:
#         return jsonify({
#             "message": "Valid start_date is required"
#         }), 400

#     if not end_date:
#         return jsonify({
#             "message": "Valid end_date is required"
#         }), 400

#     if end_date <= start_date:
#         return jsonify({
#             "message": "end_date must be after start_date"
#         }), 400

#     # -----------------------------------------------------
#     # Validate usage limit
#     # -----------------------------------------------------
#     if usage_limit is not None:

#         try:
#             usage_limit = int(usage_limit)
#         except (TypeError, ValueError):
#             return jsonify({
#                 "message": "usage_limit must be a number"
#             }), 400

#         if usage_limit <= 0:
#             return jsonify({
#                 "message": "usage_limit must be greater than 0"
#             }), 400

#     # -----------------------------------------------------
#     # Create promo code
#     # -----------------------------------------------------
#     promo = PromoCode(
#         code=code,
#         description=description,
#         discount_type=discount_type,
#         discount_value=discount_value,
#         minimum_order_value=minimum_order_value,
#         maximum_discount=maximum_discount,
#         usage_limit=usage_limit,
#         used_count=0,
#         start_date=start_date,
#         end_date=end_date,
#         is_active=is_active,
#         created_at=datetime.utcnow(),
#         updated_at=datetime.utcnow()
#     )

#     db.session.add(promo)
#     db.session.commit()

#     return jsonify({
#         "message": "Promo code created successfully",
#         "promo_code": promo_code_to_dict(promo)
#     }), 201


# # =========================================================
# # UPDATE PROMO CODE
# # =========================================================
# @promo_code_bp.route("/<int:promo_id>", methods=["PUT"])
# @jwt_required()
# def update_promo_code(promo_id):

#     promo = PromoCode.query.get(promo_id)

#     if not promo:
#         return jsonify({
#             "message": "Promo code not found"
#         }), 404

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     # -----------------------------------------------------
#     # Code
#     # -----------------------------------------------------
#     if "code" in data:

#         code = data.get("code", "").strip().upper()

#         if not code:
#             return jsonify({
#                 "message": "Promo code cannot be empty"
#             }), 400

#         existing = PromoCode.query.filter(
#             PromoCode.code == code,
#             PromoCode.id != promo_id
#         ).first()

#         if existing:
#             return jsonify({
#                 "message": "Promo code already exists"
#             }), 409

#         promo.code = code

#     # -----------------------------------------------------
#     # Description
#     # -----------------------------------------------------
#     if "description" in data:
#         promo.description = data.get("description")

#     # -----------------------------------------------------
#     # Discount type
#     # -----------------------------------------------------
#     if "discount_type" in data:

#         discount_type = data.get(
#             "discount_type"
#         ).strip().lower()

#         if discount_type not in [
#             "percentage",
#             "fixed"
#         ]:
#             return jsonify({
#                 "message": "Discount type must be percentage or fixed"
#             }), 400

#         promo.discount_type = discount_type

#     # -----------------------------------------------------
#     # Discount value
#     # -----------------------------------------------------
#     if "discount_value" in data:

#         try:
#             discount_value = Decimal(
#                 str(data.get("discount_value"))
#             )
#         except (InvalidOperation, ValueError):
#             return jsonify({
#                 "message": "Invalid discount value"
#             }), 400

#         if discount_value <= 0:
#             return jsonify({
#                 "message": "Discount value must be greater than 0"
#             }), 400

#         if (
#             promo.discount_type == "percentage"
#             and discount_value > 100
#         ):
#             return jsonify({
#                 "message": "Percentage discount cannot exceed 100"
#             }), 400

#         promo.discount_value = discount_value

#     # -----------------------------------------------------
#     # Minimum order value
#     # -----------------------------------------------------
#     if "minimum_order_value" in data:

#         try:
#             minimum_order_value = Decimal(
#                 str(data.get("minimum_order_value"))
#             )
#         except (InvalidOperation, ValueError):
#             return jsonify({
#                 "message": "Invalid minimum order value"
#             }), 400

#         if minimum_order_value < 0:
#             return jsonify({
#                 "message": "Minimum order value cannot be negative"
#             }), 400

#         promo.minimum_order_value = minimum_order_value

#     # -----------------------------------------------------
#     # Maximum discount
#     # -----------------------------------------------------
#     if "maximum_discount" in data:

#         value = data.get(
#             "maximum_discount"
#         )

#         if value is None:
#             promo.maximum_discount = None

#         else:
#             try:
#                 maximum_discount = Decimal(
#                     str(value)
#                 )
#             except (InvalidOperation, ValueError):
#                 return jsonify({
#                     "message": "Invalid maximum discount"
#                 }), 400

#             if maximum_discount <= 0:
#                 return jsonify({
#                     "message": "Maximum discount must be greater than 0"
#                 }), 400

#             promo.maximum_discount = maximum_discount

#     # -----------------------------------------------------
#     # Usage limit
#     # -----------------------------------------------------
#     if "usage_limit" in data:

#         value = data.get("usage_limit")

#         if value is None:
#             promo.usage_limit = None

#         else:
#             try:
#                 usage_limit = int(value)
#             except (TypeError, ValueError):
#                 return jsonify({
#                     "message": "usage_limit must be a number"
#                 }), 400

#             if usage_limit <= 0:
#                 return jsonify({
#                     "message": "usage_limit must be greater than 0"
#                 }), 400

#             if usage_limit < promo.used_count:
#                 return jsonify({
#                     "message": "Usage limit cannot be less than used count"
#                 }), 400

#             promo.usage_limit = usage_limit

#     # -----------------------------------------------------
#     # Start date
#     # -----------------------------------------------------
#     if "start_date" in data:

#         start_date = parse_datetime(
#             data.get("start_date")
#         )

#         if not start_date:
#             return jsonify({
#                 "message": "Invalid start_date"
#             }), 400

#         promo.start_date = start_date

#     # -----------------------------------------------------
#     # End date
#     # -----------------------------------------------------
#     if "end_date" in data:

#         end_date = parse_datetime(
#             data.get("end_date")
#         )

#         if not end_date:
#             return jsonify({
#                 "message": "Invalid end_date"
#             }), 400

#         promo.end_date = end_date

#     if promo.end_date <= promo.start_date:
#         return jsonify({
#             "message": "end_date must be after start_date"
#         }), 400

#     # -----------------------------------------------------
#     # Active status
#     # -----------------------------------------------------
#     if "is_active" in data:
#         promo.is_active = bool(
#             data.get("is_active")
#         )

#     promo.updated_at = datetime.utcnow()

#     db.session.commit()

#     return jsonify({
#         "message": "Promo code updated successfully",
#         "promo_code": promo_code_to_dict(promo)
#     }), 200


# # =========================================================
# # DELETE / DEACTIVATE PROMO CODE
# # =========================================================
# @promo_code_bp.route("/<int:promo_id>", methods=["DELETE"])
# @jwt_required()
# def delete_promo_code(promo_id):

#     promo = PromoCode.query.get(promo_id)

#     if not promo:
#         return jsonify({
#             "message": "Promo code not found"
#         }), 404

#     # Soft delete
#     promo.is_active = False
#     promo.updated_at = datetime.utcnow()

#     db.session.commit()

#     return jsonify({
#         "message": "Promo code deactivated successfully"
#     }), 200


# # =========================================================
# # VALIDATE PROMO CODE
# # =========================================================
# @promo_code_bp.route("/validate", methods=["POST"])
# @jwt_required()
# def validate_promo_code():

#     user_id = int(get_jwt_identity())

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     code = data.get(
#         "code",
#         ""
#     ).strip().upper()

#     order_value = data.get(
#         "order_value"
#     )

#     if not code:
#         return jsonify({
#             "message": "Promo code is required"
#         }), 400

#     if order_value is None:
#         return jsonify({
#             "message": "order_value is required"
#         }), 400

#     try:
#         order_value = Decimal(
#             str(order_value)
#         )
#     except (InvalidOperation, ValueError):
#         return jsonify({
#             "message": "Invalid order value"
#         }), 400

#     if order_value < 0:
#         return jsonify({
#             "message": "Order value cannot be negative"
#         }), 400

#     # -----------------------------------------------------
#     # Find promo code
#     # -----------------------------------------------------
#     promo = PromoCode.query.filter_by(
#         code=code
#     ).first()

#     if not promo:
#         return jsonify({
#             "message": "Invalid promo code"
#         }), 404

#     # -----------------------------------------------------
#     # Active check
#     # -----------------------------------------------------
#     if not promo.is_active:
#         return jsonify({
#             "message": "Promo code is inactive"
#         }), 400

#     # -----------------------------------------------------
#     # Date check
#     # -----------------------------------------------------
#     now = datetime.utcnow()

#     if now < promo.start_date:
#         return jsonify({
#             "message": "Promo code is not active yet"
#         }), 400

#     if now > promo.end_date:
#         return jsonify({
#             "message": "Promo code has expired"
#         }), 400

#     # -----------------------------------------------------
#     # Usage limit
#     # -----------------------------------------------------
#     if (
#         promo.usage_limit is not None
#         and promo.used_count >= promo.usage_limit
#     ):
#         return jsonify({
#             "message": "Promo code usage limit reached"
#         }), 400

#     # -----------------------------------------------------
#     # Check whether this user already used it
#     # -----------------------------------------------------
#     already_used = PromoCodeUsage.query.filter_by(
#         promo_code_id=promo.id,
#         user_id=user_id
#     ).first()

#     if already_used:
#         return jsonify({
#             "message": "You have already used this promo code"
#         }), 400

#     # -----------------------------------------------------
#     # Minimum order value
#     # -----------------------------------------------------
#     if order_value < promo.minimum_order_value:
#         return jsonify({
#             "message": (
#                 f"Minimum order value is "
#                 f"{float(promo.minimum_order_value):.2f}"
#             )
#         }), 400

#     # -----------------------------------------------------
#     # Calculate discount
#     # -----------------------------------------------------
#     if promo.discount_type == "percentage":

#         discount_amount = (
#             order_value
#             * promo.discount_value
#             / Decimal("100")
#         )

#     else:

#         discount_amount = promo.discount_value

#     # -----------------------------------------------------
#     # Maximum discount
#     # -----------------------------------------------------
#     if promo.maximum_discount is not None:

#         discount_amount = min(
#             discount_amount,
#             promo.maximum_discount
#         )

#     # Discount cannot exceed order value
#     discount_amount = min(
#         discount_amount,
#         order_value
#     )

#     final_amount = (
#         order_value
#         - discount_amount
#     )

#     return jsonify({
#         "message": "Promo code applied successfully",
#         "promo_code": promo.code,
#         "discount_type": promo.discount_type,
#         "discount_value": float(promo.discount_value),
#         "order_value": float(order_value),
#         "discount_amount": round(
#             float(discount_amount),
#             2
#         ),
#         "final_amount": round(
#             float(final_amount),
#             2
#         )
#     }), 200


# # =========================================================
# # RECORD PROMO CODE USAGE
# # =========================================================
# @promo_code_bp.route("/usage", methods=["POST"])
# @jwt_required()
# def record_promo_usage():

#     user_id = int(get_jwt_identity())

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "message": "Request body is required"
#         }), 400

#     promo_id = data.get("promo_code_id")
#     order_id = data.get("order_id")
#     discount_amount = data.get(
#         "discount_amount",
#         0
#     )

#     if not promo_id:
#         return jsonify({
#             "message": "promo_code_id is required"
#         }), 400

#     if not order_id:
#         return jsonify({
#             "message": "order_id is required"
#         }), 400

#     # -----------------------------------------------------
#     # Find promo
#     # -----------------------------------------------------
#     promo = PromoCode.query.get(promo_id)

#     if not promo:
#         return jsonify({
#             "message": "Promo code not found"
#         }), 404

#     # -----------------------------------------------------
#     # Find order belonging to user
#     # -----------------------------------------------------
#     order = Order.query.filter_by(
#         id=order_id,
#         user_id=user_id
#     ).first()

#     if not order:
#         return jsonify({
#             "message": "Order not found"
#         }), 404

#     # -----------------------------------------------------
#     # Prevent duplicate usage
#     # -----------------------------------------------------
#     existing_usage = PromoCodeUsage.query.filter_by(
#         promo_code_id=promo.id,
#         user_id=user_id
#     ).first()

#     if existing_usage:
#         return jsonify({
#             "message": "Promo code already used by this user"
#         }), 409

#     try:
#         discount_amount = Decimal(
#             str(discount_amount)
#         )
#     except (InvalidOperation, ValueError):
#         return jsonify({
#             "message": "Invalid discount amount"
#         }), 400

#     if discount_amount < 0:
#         return jsonify({
#             "message": "Discount amount cannot be negative"
#         }), 400

#     # -----------------------------------------------------
#     # Check usage limit
#     # -----------------------------------------------------
#     if (
#         promo.usage_limit is not None
#         and promo.used_count >= promo.usage_limit
#     ):
#         return jsonify({
#             "message": "Promo code usage limit reached"
#         }), 400

#     # -----------------------------------------------------
#     # Create usage record
#     # -----------------------------------------------------
#     usage = PromoCodeUsage(
#         promo_code_id=promo.id,
#         user_id=user_id,
#         order_id=order.id,
#         discount_amount=discount_amount,
#         used_at=datetime.utcnow()
#     )

#     db.session.add(usage)

#     promo.used_count += 1

#     db.session.commit()

#     return jsonify({
#         "message": "Promo code usage recorded successfully",
#         "usage_id": usage.id
#     }), 201
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from middleware.admin_required import admin_required
from datetime import datetime, timezone

from services.promo_code_service import (
    get_all_promo_codes,
    get_active_promo_codes,
    get_promo_code_by_id,
    create_promo_code,
    update_promo_code,
    delete_promo_code,
    get_promo_code_by_code,
    validate_promo_code,
    calculate_promo_discount,
    record_promo_code_usage,
    get_user_promo_code_usage,
    get_promo_code_preview
)


promo_code_bp = Blueprint(
    "promo_code",
    __name__,
    url_prefix="/api/promo-codes"
)


# =========================================================
# HELPER
# =========================================================

def parse_promo_datetime(value):
    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, str) and value.strip():
        try:
            parsed = datetime.fromisoformat(
                value.replace("Z", "+00:00")
            )
        except ValueError:
            return None
    else:
        return None

    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(
            tzinfo=None
        )

    return parsed


def promo_code_to_dict(promo):
    return {
        "id": promo.id,
        "code": promo.code,
        "description": promo.description,
        "discount_type": promo.discount_type,
        "discount_value": float(promo.discount_value),
        "minimum_order_value": float(promo.minimum_order_value),
        "minimum_order_amount": float(promo.minimum_order_value),
        "maximum_discount": (
            float(promo.maximum_discount)
            if promo.maximum_discount is not None
            else None
        ),
        "maximum_discount_amount": (
            float(promo.maximum_discount)
            if promo.maximum_discount is not None
            else None
        ),
        "usage_limit": promo.usage_limit,
        "total_usage_limit": promo.usage_limit,
        "per_user_limit": promo.per_user_limit,
        "used_count": promo.used_count,
        "start_date": (
            promo.start_date.isoformat()
            if promo.start_date
            else None
        ),
        "end_date": (
            promo.end_date.isoformat()
            if promo.end_date
            else None
        ),
        "is_active": promo.is_active,
        "created_at": (
            promo.created_at.isoformat()
            if promo.created_at
            else None
        ),
        "updated_at": (
            promo.updated_at.isoformat()
            if promo.updated_at
            else None
        )
    }


# =========================================================
# GET ALL PROMO CODES
# =========================================================

@promo_code_bp.route("", methods=["GET"])
@admin_required
def get_promo_codes():

    promo_codes = get_all_promo_codes()

    return jsonify({
        "promo_codes": [
            promo_code_to_dict(promo)
            for promo in promo_codes
        ]
    }), 200


# =========================================================
# GET ACTIVE PROMO CODES
# =========================================================

@promo_code_bp.route("/active", methods=["GET"])
def get_active_promo_codes_route():

    promo_codes = get_active_promo_codes()

    return jsonify({
        "promo_codes": [
            promo_code_to_dict(promo)
            for promo in promo_codes
        ]
    }), 200


# =========================================================
# GET SINGLE PROMO CODE
# =========================================================

@promo_code_bp.route("/<int:promo_id>", methods=["GET"])
@jwt_required()
def get_promo_code(promo_id):

    promo = get_promo_code_by_id(promo_id)

    if not promo:
        return jsonify({
            "message": "Promo code not found"
        }), 404

    return jsonify({
        "promo_code": promo_code_to_dict(promo)
    }), 200


# =========================================================
# CREATE PROMO CODE
# =========================================================

@promo_code_bp.route("", methods=["POST"])
@admin_required
def create_promo_code_route():

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    start_date = parse_promo_datetime(
        data.get("start_date")
    )
    end_date = parse_promo_datetime(
        data.get("end_date")
    )

    if start_date is None or end_date is None:
        return jsonify({
            "message": "Valid start_date and end_date are required"
        }), 400

    promo, error = create_promo_code(
        code=data.get("code"),
        description=data.get("description"),
        discount_type=data.get(
            "discount_type",
            "percentage"
        ),
        discount_value=data.get(
            "discount_value",
            0
        ),
        minimum_order_value=data.get(
            "minimum_order_amount",
            data.get("minimum_order_value", 0)
        ),
        maximum_discount=data.get(
            "maximum_discount_amount",
            data.get("maximum_discount")
        ),
        usage_limit=data.get(
            "total_usage_limit",
            data.get("usage_limit")
        ),
        per_user_limit=data.get("per_user_limit"),
        start_date=start_date,
        end_date=end_date
    )

    if error:
        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Promo code created successfully",
        "promo_code": promo_code_to_dict(promo)
    }), 201


# =========================================================
# UPDATE PROMO CODE
# =========================================================

@promo_code_bp.route("/<int:promo_id>", methods=["PUT"])
@admin_required
def update_promo_code_route(promo_id):

    promo = get_promo_code_by_id(promo_id)

    if not promo:
        return jsonify({
            "message": "Promo code not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    start_date = None
    if "start_date" in data:
        start_date = parse_promo_datetime(data["start_date"])
        if start_date is None:
            return jsonify({
                "message": "Valid start_date is required"
            }), 400

    end_date = None
    if "end_date" in data:
        end_date = parse_promo_datetime(data["end_date"])
        if end_date is None:
            return jsonify({
                "message": "Valid end_date is required"
            }), 400

    optional_fields = {}
    if (
        "maximum_discount_amount" in data
        or "maximum_discount" in data
    ):
        optional_fields["maximum_discount"] = data.get(
            "maximum_discount_amount",
            data.get("maximum_discount")
        )
    if "total_usage_limit" in data or "usage_limit" in data:
        optional_fields["usage_limit"] = data.get(
            "total_usage_limit",
            data.get("usage_limit")
        )
    if "per_user_limit" in data:
        optional_fields["per_user_limit"] = data["per_user_limit"]

    promo, error = update_promo_code(
        promo_code=promo,
        code=data.get("code")
        if "code" in data else None,

        description=data.get("description")
        if "description" in data else None,

        discount_type=data.get("discount_type")
        if "discount_type" in data else None,

        discount_value=data.get("discount_value")
        if "discount_value" in data else None,

        minimum_order_value=data.get(
            "minimum_order_amount",
            data.get("minimum_order_value")
        )
        if (
            "minimum_order_amount" in data
            or "minimum_order_value" in data
        ) else None,

        start_date=start_date,
        end_date=end_date,

        is_active=data.get("is_active")
        if "is_active" in data else None
        , **optional_fields
    )

    if error:
        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Promo code updated successfully",
        "promo_code": promo_code_to_dict(promo)
    }), 200


# =========================================================
# DELETE / DEACTIVATE PROMO CODE
# =========================================================

@promo_code_bp.route("/<int:promo_id>", methods=["DELETE"])
@admin_required
def delete_promo_code_route(promo_id):

    promo = get_promo_code_by_id(promo_id)

    if not promo:
        return jsonify({
            "message": "Promo code not found"
        }), 404

    promo, error = delete_promo_code(promo)

    if error:
        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Promo code deactivated successfully"
    }), 200


# =========================================================
# VALIDATE PROMO CODE
# =========================================================

@promo_code_bp.route("/validate", methods=["POST"])
@jwt_required()
def validate_promo_code_route():

    user_id = int(get_jwt_identity())

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    code = data.get("code")

    order_value = data.get("order_value")

    if not code:
        return jsonify({
            "message": "Promo code is required"
        }), 400

    if order_value is None:
        return jsonify({
            "message": "order_value is required"
        }), 400

    promo, error = validate_promo_code(
        code=code,
        user_id=user_id,
        order_amount=order_value
    )

    if error:
        return jsonify({
            "message": error
        }), 400

    discount, error = calculate_promo_discount(
        promo_code=promo,
        order_amount=order_value
    )

    if error:
        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Promo code applied successfully",
        "promo_code": promo.code,
        "discount_type": promo.discount_type,
        "discount_value": float(
            promo.discount_value
        ),
        "order_value": discount["order_amount"],
        "discount_amount": discount["discount_amount"],
        "final_amount": discount["final_amount"]
    }), 200


# =========================================================
# PROMO CODE PREVIEW
# =========================================================

@promo_code_bp.route("/preview", methods=["POST"])
@jwt_required()
def promo_code_preview():

    user_id = int(get_jwt_identity())

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    code = data.get("code")
    order_amount = data.get("order_amount")

    if not code:
        return jsonify({
            "message": "Promo code is required"
        }), 400

    if order_amount is None:
        return jsonify({
            "message": "order_amount is required"
        }), 400

    preview, error = get_promo_code_preview(
        code=code,
        user_id=user_id,
        order_amount=order_amount
    )

    if error:
        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Promo code preview calculated successfully",
        "code": preview["code"],
        "order_amount": preview["order_amount"],
        "discount_amount": preview["discount_amount"],
        "promo_code_discount": preview["discount_amount"],
        "final_amount": preview["final_amount"],
        "promo_code": preview
    }), 200


# =========================================================
# RECORD PROMO CODE USAGE
# =========================================================

@promo_code_bp.route("/usage", methods=["POST"])
@jwt_required()
def record_promo_usage_route():

    user_id = int(get_jwt_identity())

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    promo_id = data.get("promo_code_id")
    order_id = data.get("order_id")
    discount_amount = data.get(
        "discount_amount",
        0
    )

    if not promo_id:
        return jsonify({
            "message": "promo_code_id is required"
        }), 400

    if not order_id:
        return jsonify({
            "message": "order_id is required"
        }), 400

    promo = get_promo_code_by_id(promo_id)

    if not promo:
        return jsonify({
            "message": "Promo code not found"
        }), 404

    usage, error = record_promo_code_usage(
        promo_code=promo,
        user_id=user_id,
        order_id=order_id,
        discount_amount=discount_amount
    )

    if error:
        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Promo code usage recorded successfully",
        "usage_id": usage.id
    }), 201


# =========================================================
# GET USER PROMO CODE USAGE
# =========================================================

@promo_code_bp.route("/usage", methods=["GET"])
@jwt_required()
def get_my_promo_code_usage():

    user_id = int(get_jwt_identity())

    usages = get_user_promo_code_usage(user_id)

    return jsonify({
        "usages": [
            {
                "id": usage.id,
                "promo_code_id": usage.promo_code_id,
                "order_id": usage.order_id,
                "discount_amount": float(
                    usage.discount_amount
                ),
                "used_at": (
                    usage.used_at.isoformat()
                    if usage.used_at
                    else None
                )
            }
            for usage in usages
        ]
    }), 200