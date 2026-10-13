# from extensions import db
# from models.wishlist import Wishlist
# from models.product import Product


# def get_user_wishlist(user_id):
#     """
#     Get all wishlist items for a user.
#     """

#     return Wishlist.query.filter_by(
#         user_id=user_id
#     ).order_by(
#         Wishlist.created_at.desc()
#     ).all()


# def get_wishlist_item(user_id, product_id):
#     """
#     Get a specific wishlist item for a user.
#     """

#     return Wishlist.query.filter_by(
#         user_id=user_id,
#         product_id=product_id
#     ).first()


# def add_to_wishlist(user_id, product_id):
#     """
#     Add a product to the user's wishlist.
#     """

#     product = db.session.get(Product, product_id)

#     if not product:
#         return None, "Product not found"

#     if not product.is_active:
#         return None, "Product is not available"

#     existing_item = Wishlist.query.filter_by(
#         user_id=user_id,
#         product_id=product_id
#     ).first()

#     if existing_item:
#         return None, "Product is already in wishlist"

#     wishlist_item = Wishlist(
#         user_id=user_id,
#         product_id=product_id
#     )

#     db.session.add(wishlist_item)
#     db.session.commit()

#     return wishlist_item, None


# def remove_from_wishlist(user_id, product_id):
#     """
#     Remove a product from the user's wishlist.
#     """

#     wishlist_item = Wishlist.query.filter_by(
#         user_id=user_id,
#         product_id=product_id
#     ).first()

#     if not wishlist_item:
#         return None, "Product is not in wishlist"

#     db.session.delete(wishlist_item)
#     db.session.commit()

#     return True, None


# def is_product_in_wishlist(user_id, product_id):
#     """
#     Check whether a product is in the user's wishlist.
#     """

#     wishlist_item = Wishlist.query.filter_by(
#         user_id=user_id,
#         product_id=product_id
#     ).first()

#     return wishlist_item is not None


# def clear_wishlist(user_id):
#     """
#     Remove all wishlist items for a user.
#     """

#     Wishlist.query.filter_by(
#         user_id=user_id
#     ).delete()

#     db.session.commit()

#     return True


# def get_wishlist_count(user_id):
#     """
#     Get the total number of wishlist items.
#     """

#     return Wishlist.query.filter_by(
#         user_id=user_id
#     ).count()

from extensions import db
from models.wishlist import Wishlist
from models.product import Product


# =========================================================
# GET USER WISHLIST
# =========================================================
def get_user_wishlist(user_id):
    """
    Get all wishlist items for a user.
    """

    return Wishlist.query.filter_by(
        user_id=user_id
    ).order_by(
        Wishlist.created_at.desc()
    ).all()


# =========================================================
# GET SINGLE WISHLIST ITEM
# =========================================================
def get_wishlist_item(user_id, product_id):
    """
    Get a specific wishlist item for a user.
    """

    return Wishlist.query.filter_by(
        user_id=user_id,
        product_id=product_id
    ).first()


# =========================================================
# ADD TO WISHLIST
# =========================================================
def add_to_wishlist(user_id, product_id):
    """
    Add a product to the user's wishlist.
    """

    product = Product.query.filter_by(
        id=product_id,
        is_active=True
    ).first()

    if not product:
        return None, "Product not found"

    existing_item = Wishlist.query.filter_by(
        user_id=user_id,
        product_id=product_id
    ).first()

    if existing_item:
        return None, "Product already in wishlist"

    wishlist_item = Wishlist(
        user_id=user_id,
        product_id=product_id
    )

    db.session.add(wishlist_item)
    db.session.commit()

    return wishlist_item, None


# =========================================================
# REMOVE FROM WISHLIST
# =========================================================
def remove_from_wishlist(user_id, product_id):
    """
    Remove a product from the user's wishlist.
    """

    wishlist_item = Wishlist.query.filter_by(
        user_id=user_id,
        product_id=product_id
    ).first()

    if not wishlist_item:
        return None, "Product not found in wishlist"

    db.session.delete(wishlist_item)
    db.session.commit()

    return True, None


# =========================================================
# CHECK WISHLIST
# =========================================================
def is_product_in_wishlist(user_id, product_id):
    """
    Check whether a product is in the user's wishlist.
    """

    wishlist_item = Wishlist.query.filter_by(
        user_id=user_id,
        product_id=product_id
    ).first()

    return wishlist_item is not None


# =========================================================
# CLEAR WISHLIST
# =========================================================
def clear_wishlist(user_id):
    """
    Remove all wishlist items for a user.
    """

    Wishlist.query.filter_by(
        user_id=user_id
    ).delete()

    db.session.commit()

    return True


# =========================================================
# WISHLIST COUNT
# =========================================================
def get_wishlist_count(user_id):
    """
    Get the total number of wishlist items.
    """

    return Wishlist.query.filter_by(
        user_id=user_id
    ).count()