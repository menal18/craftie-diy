# from extensions import db
# from models.product import Product
# from models.category import Category


# def get_all_products(active_only=False):
#     query = Product.query

#     if active_only:
#         query = query.filter_by(is_active=True)

#     return query.order_by(
#         Product.created_at.desc()
#     ).all()


# def get_product_by_id(product_id):
#     return db.session.get(Product, product_id)


# def create_product(
#     category_id,
#     name,
#     description,
#     price,
#     stock_quantity,
#     image_url=None
# ):
#     if not category_id:
#         return None, "Category is required"

#     if not name:
#         return None, "Product name is required"

#     category = db.session.get(Category, category_id)

#     if not category:
#         return None, "Category not found"

#     if price is None:
#         return None, "Price is required"

#     if float(price) < 0:
#         return None, "Price cannot be negative"

#     if stock_quantity is None:
#         stock_quantity = 0

#     if int(stock_quantity) < 0:
#         return None, "Stock quantity cannot be negative"

#     existing = Product.query.filter_by(
#         name=name.strip()
#     ).first()

#     if existing:
#         return None, "Product already exists"

#     product = Product(
#         category_id=category_id,
#         name=name.strip(),
#         description=description,
#         price=price,
#         stock_quantity=stock_quantity,
#         image_url=image_url,
#         is_active=True
#     )

#     db.session.add(product)
#     db.session.commit()

#     return product, None


# def update_product(
#     product,
#     category_id=None,
#     name=None,
#     description=None,
#     price=None,
#     stock_quantity=None,
#     image_url=None,
#     is_active=None
# ):
#     if category_id is not None:
#         category = db.session.get(Category, category_id)

#         if not category:
#             return None, "Category not found"

#         product.category_id = category_id

#     if name is not None:
#         name = name.strip()

#         if not name:
#             return None, "Product name cannot be empty"

#         existing = Product.query.filter(
#             Product.name == name,
#             Product.id != product.id
#         ).first()

#         if existing:
#             return None, "Product already exists"

#         product.name = name

#     if description is not None:
#         product.description = description

#     if price is not None:
#         if float(price) < 0:
#             return None, "Price cannot be negative"

#         product.price = price

#     if stock_quantity is not None:
#         if int(stock_quantity) < 0:
#             return None, "Stock quantity cannot be negative"

#         product.stock_quantity = stock_quantity

#     if image_url is not None:
#         product.image_url = image_url

#     if is_active is not None:
#         product.is_active = bool(is_active)

#     db.session.commit()

#     return product, None


# def delete_product(product):
#     product.is_active = False

#     db.session.commit()

#     return product

from extensions import db
from sqlalchemy import func, or_
from models.order import Order
from models.order_item import OrderItem
from models.product import Product
from models.category import Category


def parse_is_active(value):
    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        normalized = value.strip().lower()

        if normalized == "true":
            return True

        if normalized == "false":
            return False

    if isinstance(value, (int, float)) and value in (0, 1):
        return bool(value)

    return None


# =========================================================
# GET ALL PRODUCTS
# =========================================================
def get_all_products(active_only=False):

    query = Product.query

    if active_only:
        query = query.filter_by(is_active=True)

    return query.order_by(
        Product.created_at.desc()
    ).all()


def search_products(search_term, limit=8):
    escaped_term = (
        search_term
        .replace("\\", "\\\\")
        .replace("%", "\\%")
        .replace("_", "\\_")
    )
    search_pattern = f"%{escaped_term}%"

    return (
        Product.query
        .filter(
            Product.is_active.is_(True),
            or_(
                Product.name.ilike(search_pattern, escape="\\"),
                Product.description.ilike(search_pattern, escape="\\")
            )
        )
        .order_by(Product.name.asc())
        .limit(limit)
        .all()
    )


def get_bestselling_products():
    sold_quantity = func.sum(OrderItem.quantity).label("sold_quantity")

    return (
        db.session.query(Product, sold_quantity)
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(
            Product.is_active.is_(True),
            Order.order_status.in_(("delivered", "completed")),
            func.lower(Order.payment_status) != "refunded"
        )
        .group_by(Product.id)
        .order_by(sold_quantity.desc(), Product.name.asc())
        .all()
    )


# =========================================================
# GET PRODUCT BY ID
# =========================================================
def get_product_by_id(product_id):

    return db.session.get(
        Product,
        product_id
    )


def get_related_products(product_id, limit=8):
    current_product = db.session.get(Product, product_id)

    if not current_product or not current_product.is_active:
        return None

    return (
        Product.query
        .filter(
            Product.category_id == current_product.category_id,
            Product.id != current_product.id,
            Product.is_active.is_(True),
            Product.stock_quantity > 0
        )
        .order_by(Product.created_at.desc())
        .limit(limit)
        .all()
    )


# =========================================================
# CREATE PRODUCT
# =========================================================
def create_product(
    category_id,
    name,
    description,
    price,
    stock_quantity,
    image_url=None,
    is_active=True
):

    if not category_id:
        return None, "Category ID is required"

    if not name:
        return None, "Product name is required"

    name = name.strip()

    # Check category
    category = db.session.get(
        Category,
        category_id
    )

    if not category or not category.is_active:
        return None, "Category not found"

    # Check price
    if price is None:
        return None, "Product price is required"

    try:
        price = float(price)
    except (ValueError, TypeError):
        return None, "Invalid price"

    if price < 0:
        return None, "Price cannot be negative"

    # Check stock
    if stock_quantity is None:
        stock_quantity = 0

    try:
        stock_quantity = int(stock_quantity)
    except (ValueError, TypeError):
        return None, "Invalid stock quantity"

    if stock_quantity < 0:
        return None, "Stock quantity cannot be negative"

    is_active = parse_is_active(is_active)

    if is_active is None:
        return None, "is_active must be a boolean"

    # Check duplicate product
    existing = Product.query.filter_by(
        name=name
    ).first()

    if existing:
        return None, "Product already exists"

    product = Product(
        category_id=category_id,
        name=name,
        description=description,
        price=price,
        stock_quantity=stock_quantity,
        image_url=image_url,
        is_active=is_active
    )

    db.session.add(product)
    db.session.commit()

    return product, None


# =========================================================
# UPDATE PRODUCT
# =========================================================
def update_product(
    product,
    category_id=None,
    name=None,
    description=None,
    price=None,
    stock_quantity=None,
    image_url=None,
    is_active=None
):

    # Category
    if category_id is not None:

        category = db.session.get(
            Category,
            category_id
        )

        if not category or not category.is_active:
            return None, "Category not found"

        product.category_id = category_id

    # Name
    if name is not None:

        name = name.strip()

        if not name:
            return None, "Product name cannot be empty"

        existing = Product.query.filter(
            Product.name == name,
            Product.id != product.id
        ).first()

        if existing:
            return None, "Product already exists"

        product.name = name

    # Description
    if description is not None:
        product.description = description

    # Price
    if price is not None:

        try:
            price = float(price)
        except (ValueError, TypeError):
            return None, "Invalid price"

        if price < 0:
            return None, "Price cannot be negative"

        product.price = price

    # Stock
    if stock_quantity is not None:

        try:
            stock_quantity = int(stock_quantity)
        except (ValueError, TypeError):
            return None, "Invalid stock quantity"

        if stock_quantity < 0:
            return None, "Stock quantity cannot be negative"

        product.stock_quantity = stock_quantity

    # Image
    if image_url is not None:
        product.image_url = image_url

    # Active status
    if is_active is not None:
        is_active = parse_is_active(is_active)

        if is_active is None:
            return None, "is_active must be a boolean"

        product.is_active = is_active

    db.session.commit()

    return product, None


# =========================================================
# DELETE / DEACTIVATE PRODUCT
# =========================================================
def delete_product(product):

    product.is_active = False

    db.session.commit()

    return product


    