# from extensions import db
# from models.address import Address


# def get_user_addresses(user_id):
#     """
#     Get all addresses belonging to a user.
#     Default address is returned first.
#     """

#     return Address.query.filter_by(
#         user_id=user_id
#     ).order_by(
#         Address.is_default.desc(),
#         Address.created_at.desc()
#     ).all()


# def get_address_by_id(user_id, address_id):
#     """
#     Get a specific address belonging to the user.
#     """

#     return Address.query.filter_by(
#         id=address_id,
#         user_id=user_id
#     ).first()


# def get_default_address(user_id):
#     """
#     Get the user's default address.
#     """

#     return Address.query.filter_by(
#         user_id=user_id,
#         is_default=True
#     ).first()


# def create_address(
#     user_id,
#     full_name,
#     phone,
#     address_line1,
#     address_line2=None,
#     city=None,
#     state=None,
#     postal_code=None,
#     country="India",
#     address_type="home",
#     is_default=False
# ):
#     """
#     Create a new address for a user.

#     If this is the user's first address,
#     it automatically becomes the default address.
#     """

#     if not full_name:
#         return None, "Full name is required"

#     if not phone:
#         return None, "Phone number is required"

#     if not address_line1:
#         return None, "Address line 1 is required"

#     # Check whether user already has an address
#     existing_address = Address.query.filter_by(
#         user_id=user_id
#     ).first()

#     # First address automatically becomes default
#     if not existing_address:
#         is_default = True

#     # If this address should be default,
#     # remove default status from existing addresses
#     if is_default:
#         Address.query.filter_by(
#             user_id=user_id,
#             is_default=True
#         ).update({
#             "is_default": False
#         })

#     address = Address(
#         user_id=user_id,
#         full_name=full_name.strip(),
#         phone=phone.strip(),
#         address_line1=address_line1.strip(),
#         address_line2=(
#             address_line2.strip()
#             if address_line2
#             else None
#         ),
#         city=city.strip() if city else None,
#         state=state.strip() if state else None,
#         postal_code=(
#             postal_code.strip()
#             if postal_code
#             else None
#         ),
#         country=country.strip() if country else "India",
#         address_type=(
#             address_type.strip()
#             if address_type
#             else "home"
#         ),
#         is_default=is_default
#     )

#     db.session.add(address)
#     db.session.commit()

#     return address, None


# def update_address(
#     user_id,
#     address_id,
#     full_name=None,
#     phone=None,
#     address_line1=None,
#     address_line2=None,
#     city=None,
#     state=None,
#     postal_code=None,
#     country=None,
#     address_type=None,
#     is_default=None
# ):
#     """
#     Update an existing user address.
#     """

#     address = get_address_by_id(
#         user_id,
#         address_id
#     )

#     if not address:
#         return None, "Address not found"

#     if full_name is not None:
#         if not full_name.strip():
#             return None, "Full name cannot be empty"

#         address.full_name = full_name.strip()

#     if phone is not None:
#         if not phone.strip():
#             return None, "Phone number cannot be empty"

#         address.phone = phone.strip()

#     if address_line1 is not None:
#         if not address_line1.strip():
#             return None, "Address line 1 cannot be empty"

#         address.address_line1 = address_line1.strip()

#     if address_line2 is not None:
#         address.address_line2 = (
#             address_line2.strip()
#             if address_line2.strip()
#             else None
#         )

#     if city is not None:
#         address.city = city.strip()

#     if state is not None:
#         address.state = state.strip()

#     if postal_code is not None:
#         address.postal_code = postal_code.strip()

#     if country is not None:
#         address.country = country.strip()

#     if address_type is not None:
#         address.address_type = address_type.strip()

#     # Make this address default
#     if is_default is True:

#         Address.query.filter(
#             Address.user_id == user_id,
#             Address.id != address.id
#         ).update({
#             "is_default": False
#         })

#         address.is_default = True

#     # Don't allow the only/default address
#     # to become non-default accidentally
#     elif is_default is False:

#         other_default = Address.query.filter(
#             Address.user_id == user_id,
#             Address.id != address.id,
#             Address.is_default == True
#         ).first()

#         if other_default:
#             address.is_default = False

#         else:
#             address.is_default = True

#     db.session.commit()

#     return address, None


# def set_default_address(user_id, address_id):
#     """
#     Set an address as the user's default address.
#     """

#     address = get_address_by_id(
#         user_id,
#         address_id
#     )

#     if not address:
#         return None, "Address not found"

#     # Remove default from all other addresses
#     Address.query.filter(
#         Address.user_id == user_id,
#         Address.id != address.id
#     ).update({
#         "is_default": False
#     })

#     address.is_default = True

#     db.session.commit()

#     return address, None


# def delete_address(user_id, address_id):
#     """
#     Delete an address.

#     If the deleted address was the default,
#     another address is automatically selected
#     as the default.
#     """

#     address = get_address_by_id(
#         user_id,
#         address_id
#     )

#     if not address:
#         return None, "Address not found"

#     was_default = address.is_default

#     db.session.delete(address)
#     db.session.flush()

#     # If default address was deleted,
#     # choose another address
#     if was_default:

#         next_address = Address.query.filter_by(
#             user_id=user_id
#         ).order_by(
#             Address.created_at.desc()
#         ).first()

#         if next_address:
#             next_address.is_default = True

#     db.session.commit()

#     return True, None


# def get_address_count(user_id):
#     """
#     Get the total number of addresses for a user.
#     """

#     return Address.query.filter_by(
#         user_id=user_id
#     ).count()
from extensions import db
from models.address import Address
from datetime import datetime


# =========================================================
# GET ALL USER ADDRESSES
# =========================================================
def get_user_addresses(user_id):
    """
    Get all addresses belonging to a user.
    Default address is returned first.
    """

    return Address.query.filter_by(
        user_id=user_id
    ).order_by(
        Address.is_default.desc(),
        Address.created_at.desc()
    ).all()


# =========================================================
# GET SINGLE ADDRESS
# =========================================================
def get_address_by_id(user_id, address_id):
    """
    Get a specific address belonging to the user.
    """

    return Address.query.filter_by(
        id=address_id,
        user_id=user_id
    ).first()


# =========================================================
# GET DEFAULT ADDRESS
# =========================================================
def get_default_address(user_id):
    """
    Get the user's default address.
    """

    return Address.query.filter_by(
        user_id=user_id,
        is_default=True
    ).first()


# =========================================================
# CREATE ADDRESS
# =========================================================
def create_address(
    user_id,
    full_name,
    phone,
    address_line1,
    address_line2=None,
    city=None,
    state=None,
    postal_code=None,
    country="India",
    address_type="home",
    is_default=False
):
    """
    Create a new address.

    First address automatically becomes default.
    """

    if not full_name or not full_name.strip():
        return None, "Full name is required"

    if not phone or not phone.strip():
        return None, "Phone is required"

    if not address_line1 or not address_line1.strip():
        return None, "Address line 1 is required"

    if not city or not city.strip():
        return None, "City is required"

    if not state or not state.strip():
        return None, "State is required"

    if not postal_code or not postal_code.strip():
        return None, "Postal code is required"

    address_type = (
        address_type.strip().lower()
        if address_type
        else "home"
    )

    if address_type not in ["home", "work", "other"]:
        return None, "Address type must be home, work or other"

    existing_count = Address.query.filter_by(
        user_id=user_id
    ).count()

    # First address automatically becomes default
    if existing_count == 0:
        is_default = True

    # Remove existing default address
    if is_default:
        Address.query.filter_by(
            user_id=user_id,
            is_default=True
        ).update({
            "is_default": False
        })

    address = Address(
        user_id=user_id,
        full_name=full_name.strip(),
        phone=phone.strip(),
        address_line1=address_line1.strip(),
        address_line2=(
            address_line2.strip()
            if address_line2 and address_line2.strip()
            else None
        ),
        city=city.strip(),
        state=state.strip(),
        postal_code=postal_code.strip(),
        country=(
            country.strip()
            if country and country.strip()
            else "India"
        ),
        address_type=address_type,
        is_default=bool(is_default),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.session.add(address)
    db.session.commit()

    return address, None


# =========================================================
# UPDATE ADDRESS
# =========================================================
def update_address(
    user_id,
    address_id,
    full_name=None,
    phone=None,
    address_line1=None,
    address_line2=None,
    city=None,
    state=None,
    postal_code=None,
    country=None,
    address_type=None,
    is_default=None
):
    """
    Update an existing user address.
    """

    address = get_address_by_id(
        user_id,
        address_id
    )

    if not address:
        return None, "Address not found"

    # -----------------------------------------
    # Full name
    # -----------------------------------------
    if full_name is not None:

        if not full_name.strip():
            return None, "Full name cannot be empty"

        address.full_name = full_name.strip()

    # -----------------------------------------
    # Phone
    # -----------------------------------------
    if phone is not None:

        if not phone.strip():
            return None, "Phone cannot be empty"

        address.phone = phone.strip()

    # -----------------------------------------
    # Address line 1
    # -----------------------------------------
    if address_line1 is not None:

        if not address_line1.strip():
            return None, "Address line 1 cannot be empty"

        address.address_line1 = address_line1.strip()

    # -----------------------------------------
    # Address line 2
    # -----------------------------------------
    if address_line2 is not None:

        address.address_line2 = (
            address_line2.strip()
            if address_line2.strip()
            else None
        )

    # -----------------------------------------
    # City
    # -----------------------------------------
    if city is not None:

        if not city.strip():
            return None, "City cannot be empty"

        address.city = city.strip()

    # -----------------------------------------
    # State
    # -----------------------------------------
    if state is not None:

        if not state.strip():
            return None, "State cannot be empty"

        address.state = state.strip()

    # -----------------------------------------
    # Postal code
    # -----------------------------------------
    if postal_code is not None:

        if not postal_code.strip():
            return None, "Postal code cannot be empty"

        address.postal_code = postal_code.strip()

    # -----------------------------------------
    # Country
    # -----------------------------------------
    if country is not None:

        if not country.strip():
            return None, "Country cannot be empty"

        address.country = country.strip()

    # -----------------------------------------
    # Address type
    # -----------------------------------------
    if address_type is not None:

        address_type = address_type.strip().lower()

        if address_type not in ["home", "work", "other"]:
            return None, "Address type must be home, work or other"

        address.address_type = address_type

    # -----------------------------------------
    # Default address
    # -----------------------------------------
    if is_default is True:

        Address.query.filter(
            Address.user_id == user_id,
            Address.id != address.id
        ).update({
            "is_default": False
        })

        address.is_default = True

    elif is_default is False:

        # Don't allow the only/default address
        # to become non-default.
        other_default = Address.query.filter(
            Address.user_id == user_id,
            Address.id != address.id,
            Address.is_default == True
        ).first()

        if other_default:
            address.is_default = False
        else:
            address.is_default = True

    address.updated_at = datetime.utcnow()

    db.session.commit()

    return address, None


# =========================================================
# SET DEFAULT ADDRESS
# =========================================================
def set_default_address(user_id, address_id):
    """
    Set an address as the user's default address.
    """

    address = get_address_by_id(
        user_id,
        address_id
    )

    if not address:
        return None, "Address not found"

    Address.query.filter(
        Address.user_id == user_id,
        Address.id != address.id
    ).update({
        "is_default": False
    })

    address.is_default = True
    address.updated_at = datetime.utcnow()

    db.session.commit()

    return address, None


# =========================================================
# DELETE ADDRESS
# =========================================================
def delete_address(user_id, address_id):
    """
    Delete an address.

    If the deleted address was the default,
    another address becomes default.
    """

    address = get_address_by_id(
        user_id,
        address_id
    )

    if not address:
        return None, "Address not found"

    was_default = address.is_default

    db.session.delete(address)
    db.session.flush()

    if was_default:

        next_address = Address.query.filter_by(
            user_id=user_id
        ).order_by(
            Address.created_at.desc()
        ).first()

        if next_address:
            next_address.is_default = True

    db.session.commit()

    return True, None


# =========================================================
# ADDRESS COUNT
# =========================================================
def get_address_count(user_id):
    """
    Get the total number of addresses for a user.
    """

    return Address.query.filter_by(
        user_id=user_id
    ).count()