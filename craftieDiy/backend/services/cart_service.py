# from extensions import db
# from models.cart import Cart
# from models.cart_item import CartItem
# from models.product import Product


# def get_or_create_cart(user_id):
#     """
#     Get the user's cart.
#     If the cart does not exist, create one.
#     """

#     cart = Cart.query.filter_by(
#         user_id=user_id
#     ).first()

#     if not cart:
#         cart = Cart(
#             user_id=user_id
#         )

#         db.session.add(cart)
#         db.session.commit()

#     return cart


# def get_cart(user_id):
#     """
#     Get the complete cart for a user.
#     """

#     cart = get_or_create_cart(user_id)

#     return cart


# def add_to_cart(user_id, product_id, quantity=1):
#     """
#     Add a product to the user's cart.
#     If the product already exists, increase quantity.
#     """

#     product = db.session.get(Product, product_id)

#     if not product:
#         return None, "Product not found"

#     if not product.is_active:
#         return None, "Product is not available"

#     try:
#         quantity = int(quantity)
#     except (ValueError, TypeError):
#         return None, "Invalid quantity"

#     if quantity <= 0:
#         return None, "Quantity must be greater than 0"

#     if product.stock_quantity < quantity:
#         return None, "Insufficient stock"

#     cart = get_or_create_cart(user_id)

#     cart_item = CartItem.query.filter_by(
#         cart_id=cart.id,
#         product_id=product_id
#     ).first()

#     if cart_item:

#         new_quantity = cart_item.quantity + quantity

#         if new_quantity > product.stock_quantity:
#             return None, "Insufficient stock"

#         cart_item.quantity = new_quantity

#     else:

#         cart_item = CartItem(
#             cart_id=cart.id,
#             product_id=product_id,
#             quantity=quantity
#         )

#         db.session.add(cart_item)

#     db.session.commit()

#     return cart_item, None


# def update_cart_item(user_id, item_id, quantity):
#     """
#     Update the quantity of a cart item.
#     """

#     cart = Cart.query.filter_by(
#         user_id=user_id
#     ).first()

#     if not cart:
#         return None, "Cart not found"

#     cart_item = CartItem.query.filter_by(
#         id=item_id,
#         cart_id=cart.id
#     ).first()

#     if not cart_item:
#         return None, "Cart item not found"

#     try:
#         quantity = int(quantity)
#     except (ValueError, TypeError):
#         return None, "Invalid quantity"

#     if quantity <= 0:
#         return None, "Quantity must be greater than 0"

#     product = db.session.get(
#         Product,
#         cart_item.product_id
#     )

#     if not product:
#         return None, "Product not found"

#     if quantity > product.stock_quantity:
#         return None, "Insufficient stock"

#     cart_item.quantity = quantity

#     db.session.commit()

#     return cart_item, None


# def remove_from_cart(user_id, item_id):
#     """
#     Remove one item from the cart.
#     """

#     cart = Cart.query.filter_by(
#         user_id=user_id
#     ).first()

#     if not cart:
#         return None, "Cart not found"

#     cart_item = CartItem.query.filter_by(
#         id=item_id,
#         cart_id=cart.id
#     ).first()

#     if not cart_item:
#         return None, "Cart item not found"

#     db.session.delete(cart_item)

#     db.session.commit()

#     return True, None


# def clear_cart(user_id):
#     """
#     Remove all items from the user's cart.
#     """

#     cart = Cart.query.filter_by(
#         user_id=user_id
#     ).first()

#     if not cart:
#         return None, "Cart not found"

#     CartItem.query.filter_by(
#         cart_id=cart.id
#     ).delete()

#     db.session.commit()

#     return True, None


# def calculate_cart_subtotal(cart):
#     """
#     Calculate cart subtotal using current product prices.
#     """

#     subtotal = 0

#     for item in cart.items:

#         if not item.product:
#             continue

#         if not item.product.is_active:
#             continue

#         subtotal += (
#             float(item.product.price)
#             * item.quantity
#         )

#     return round(subtotal, 2)


# def get_cart_summary(user_id):
#     """
#     Return cart with subtotal and item count.
#     """

#     cart = get_or_create_cart(user_id)

#     subtotal = calculate_cart_subtotal(cart)

#     item_count = sum(
#         item.quantity
#         for item in cart.items
#         if item.product and item.product.is_active
#     )

#     return {
#         "cart": cart,
#         "subtotal": subtotal,
#         "item_count": item_count
#     }
from extensions import db
from models.cart import Cart
from models.cart_item import CartItem
from models.product import Product
from datetime import datetime


# =========================================================
# GET OR CREATE CART
# =========================================================
def get_or_create_cart(user_id):
    """
    Get the user's cart.
    If the cart does not exist, create one.
    """

    cart = Cart.query.filter_by(
        user_id=user_id
    ).first()

    if not cart:
        cart = Cart(
            user_id=user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.session.add(cart)
        db.session.commit()

    return cart


# =========================================================
# GET CART
# =========================================================
def get_cart(user_id):
    """
    Get the user's existing cart.

    Returns None if the user does not have a cart yet.
    """

    return Cart.query.filter_by(
        user_id=user_id
    ).first()


# =========================================================
# ADD PRODUCT TO CART
# =========================================================
def add_to_cart(user_id, product_id, quantity=1):
    """
    Add a product to the user's cart.

    If the product already exists,
    increase the existing quantity.
    """

    product = Product.query.filter_by(
        id=product_id,
        is_active=True
    ).first()

    if not product:
        return None, "Product not found"

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return None, "Quantity must be a valid number"

    if quantity <= 0:
        return None, "Quantity must be greater than 0"

    if product.stock_quantity <= 0:
        return None, "Product is out of stock"

    if quantity > product.stock_quantity:
        return None, f"Only {product.stock_quantity} items available"

    cart = get_or_create_cart(user_id)

    cart_item = CartItem.query.filter_by(
        cart_id=cart.id,
        product_id=product.id
    ).first()

    if cart_item:

        new_quantity = cart_item.quantity + quantity

        if new_quantity > product.stock_quantity:
            return None, f"Only {product.stock_quantity} items available"

        cart_item.quantity = new_quantity

    else:

        cart_item = CartItem(
            cart_id=cart.id,
            product_id=product.id,
            quantity=quantity
        )

        db.session.add(cart_item)

    cart.updated_at = datetime.utcnow()

    db.session.commit()

    return cart_item, None


# =========================================================
# UPDATE CART ITEM
# =========================================================
def update_cart_item(user_id, item_id, quantity):
    """
    Update the quantity of an existing cart item.
    """

    cart = Cart.query.filter_by(
        user_id=user_id
    ).first()

    if not cart:
        return None, "Cart not found"

    cart_item = CartItem.query.filter_by(
        id=item_id,
        cart_id=cart.id
    ).first()

    if not cart_item:
        return None, "Cart item not found"

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return None, "Quantity must be a valid number"

    if quantity <= 0:
        return None, "Quantity must be greater than 0"

    product = Product.query.filter_by(
        id=cart_item.product_id,
        is_active=True
    ).first()

    if not product:
        return None, "Product not found"

    if quantity > product.stock_quantity:
        return None, f"Only {product.stock_quantity} items available"

    cart_item.quantity = quantity
    cart.updated_at = datetime.utcnow()

    db.session.commit()

    return cart_item, None


# =========================================================
# REMOVE CART ITEM
# =========================================================
def remove_from_cart(user_id, item_id):
    """
    Remove one item from the user's cart.
    """

    cart = Cart.query.filter_by(
        user_id=user_id
    ).first()

    if not cart:
        return None, "Cart not found"

    cart_item = CartItem.query.filter_by(
        id=item_id,
        cart_id=cart.id
    ).first()

    if not cart_item:
        return None, "Cart item not found"

    db.session.delete(cart_item)

    cart.updated_at = datetime.utcnow()

    db.session.commit()

    return True, None


# =========================================================
# CLEAR CART
# =========================================================
def clear_cart(user_id):
    """
    Remove all items from the user's cart.
    """

    cart = Cart.query.filter_by(
        user_id=user_id
    ).first()

    if not cart:
        return None, "Cart is already empty"

    CartItem.query.filter_by(
        cart_id=cart.id
    ).delete()

    cart.updated_at = datetime.utcnow()

    db.session.commit()

    return True, None


# =========================================================
# CALCULATE CART SUBTOTAL
# =========================================================
def calculate_cart_subtotal(cart):
    """
    Calculate subtotal using the current
    product base prices.

    Promotions are NOT applied here.
    """

    subtotal = 0

    for item in cart.items:

        if not item.product:
            continue

        if not item.product.is_active:
            continue

        item_subtotal = (
            float(item.product.price)
            * item.quantity
        )

        subtotal += item_subtotal

    return round(subtotal, 2)


# =========================================================
# CART RESPONSE DATA
# =========================================================
# def get_cart_response(cart):
#     """
#     Convert cart data into the API response format.
#     """

#     items = []

#     subtotal = 0

#     for item in cart.items:

#         if not item.product:
#             continue

#         if not item.product.is_active:
#             continue

#         item_subtotal = (
#             float(item.product.price)
#             * item.quantity
#         )

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
#         "total_items": sum(
#             item.quantity
#             for item in cart.items
#             if item.product and item.product.is_active
#         ),
#         "subtotal": round(subtotal, 2)
#     }


def get_cart_response(cart):
    """
    Convert cart data into the API response format.
    """

    items = []
    subtotal = 0

    for item in cart.items:

        if not item.product:
            continue

        if not item.product.is_active:
            continue

        item_subtotal = (
            float(item.product.price)
            * item.quantity
        )

        subtotal += item_subtotal

        # -----------------------------------------
        # GET PRODUCT IMAGE
        # -----------------------------------------

        image_url = item.product.image_url

        if item.product.images:
            primary_image = next(
                (
                    image
                    for image in item.product.images
                    if image.is_primary
                ),
                None
            )

            if primary_image:
                image_url = primary_image.image_url

            elif item.product.images:
                image_url = item.product.images[0].image_url

        # -----------------------------------------
        # CART ITEM
        # -----------------------------------------

        items.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product.name,
            "product_description": item.product.description,
            "image_url": image_url,
            "unit_price": float(item.product.price),
            "quantity": item.quantity,
            "subtotal": round(item_subtotal, 2)
        })

    return {
        "cart_id": cart.id,
        "user_id": cart.user_id,
        "items": items,
        "total_items": sum(
            item.quantity
            for item in cart.items
            if item.product and item.product.is_active
        ),
        "subtotal": round(subtotal, 2)
    }
# =========================================================
# CART SUMMARY
# =========================================================
def get_cart_summary(user_id):
    """
    Return cart summary information.
    """

    cart = get_cart(user_id)

    if not cart:
        return {
            "cart": None,
            "subtotal": 0,
            "item_count": 0
        }

    subtotal = calculate_cart_subtotal(cart)

    item_count = sum(
        item.quantity
        for item in cart.items
        if item.product and item.product.is_active
    )

    return {
        "cart": cart,
        "subtotal": subtotal,
        "item_count": item_count
    }