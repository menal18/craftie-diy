# from extensions import db
# from models.category import Category


# def get_all_categories(active_only=False):
#     query = Category.query

#     if active_only:
#         query = query.filter_by(is_active=True)

#     return query.order_by(
#         Category.created_at.desc()
#     ).all()


# def get_category_by_id(category_id):
#     return db.session.get(Category, category_id)


# def create_category(name, description=None, image_url=None):
#     if not name:
#         return None, "Category name is required"

#     name = name.strip()

#     existing = Category.query.filter_by(
#         name=name
#     ).first()

#     if existing:
#         return None, "Category already exists"

#     category = Category(
#         name=name,
#         description=description,
#         image_url=image_url,
#         is_active=True
#     )

#     db.session.add(category)
#     db.session.commit()

#     return category, None


# def update_category(
#     category,
#     name=None,
#     description=None,
#     image_url=None,
#     is_active=None
# ):
#     if name is not None:
#         name = name.strip()

#         if not name:
#             return None, "Category name cannot be empty"

#         existing = Category.query.filter(
#             Category.name == name,
#             Category.id != category.id
#         ).first()

#         if existing:
#             return None, "Category already exists"

#         category.name = name

#     if description is not None:
#         category.description = description

#     if image_url is not None:
#         category.image_url = image_url

#     if is_active is not None:
#         category.is_active = bool(is_active)

#     db.session.commit()

#     return category, None


# def delete_category(category):
#     category.is_active = False

#     db.session.commit()

#     return category

# from extensions import db
# from models.category import Category


# # =========================================================
# # GET ALL CATEGORIES
# # =========================================================
# def get_all_categories(active_only=False):

#     query = Category.query

#     if active_only:
#         query = query.filter_by(is_active=True)

#     return query.order_by(
#         Category.name.asc()
#     ).all()


# # =========================================================
# # GET CATEGORY BY ID
# # =========================================================
# def get_category_by_id(category_id):

#     return db.session.get(
#         Category,
#         category_id
#     )


# # =========================================================
# # CREATE CATEGORY
# # =========================================================
# def create_category(
#     name,
#     description=None,
#     image_url=None
# ):

#     if not name:
#         return None, "Category name is required"

#     name = name.strip()

#     existing = Category.query.filter_by(
#         name=name
#     ).first()

#     if existing:
#         return None, "Category already exists"

#     category = Category(
#         name=name,
#         description=description,
#         image_url=image_url,
#         is_active=True
#     )

#     db.session.add(category)
#     db.session.commit()

#     return category, None


# # =========================================================
# # UPDATE CATEGORY
# # =========================================================
# def update_category(
#     category,
#     name=None,
#     description=None,
#     image_url=None,
#     is_active=None
# ):

#     if name is not None:

#         name = name.strip()

#         if not name:
#             return None, "Category name cannot be empty"

#         existing = Category.query.filter(
#             Category.name == name,
#             Category.id != category.id
#         ).first()

#         if existing:
#             return None, "Category already exists"

#         category.name = name

#     if description is not None:
#         category.description = description

#     if image_url is not None:
#         category.image_url = image_url

#     if is_active is not None:
#         category.is_active = bool(is_active)

#     db.session.commit()

#     return category, None


# # =========================================================
# # DELETE / DEACTIVATE CATEGORY
# # =========================================================
# def delete_category(category):

#     category.is_active = False

#     db.session.commit()

#     return category

from extensions import db
from models.category import Category


# =========================================================
# GET ALL CATEGORIES
# =========================================================
def get_all_categories(active_only=False):
    query = Category.query

    if active_only:
        query = query.filter_by(is_active=True)

    return query.order_by(
        Category.name.asc()
    ).all()


# =========================================================
# GET CATEGORY BY ID
# =========================================================
def get_category_by_id(category_id):
    return db.session.get(
        Category,
        category_id
    )


# =========================================================
# CREATE CATEGORY
# =========================================================
def create_category(
    name,
    description=None,
    image_url=None,
    is_active=True
):

    if not name:
        return None, "Category name is required"

    name = name.strip()

    existing = Category.query.filter_by(
        name=name
    ).first()

    if existing:
        return None, "Category already exists"

    category = Category(
        name=name,
        description=description,
        image_url=image_url,
        is_active=bool(is_active)
    )

    db.session.add(category)
    db.session.commit()

    return category, None


# =========================================================
# UPDATE CATEGORY
# =========================================================
def update_category(
    category,
    name=None,
    description=None,
    image_url=None,
    is_active=None
):

    if name is not None:

        name = name.strip()

        if not name:
            return None, "Category name cannot be empty"

        existing = Category.query.filter(
            Category.name == name,
            Category.id != category.id
        ).first()

        if existing:
            return None, "Category already exists"

        category.name = name

    if description is not None:
        category.description = description

    if image_url is not None:
        category.image_url = image_url

    if is_active is not None:
        category.is_active = bool(is_active)

    db.session.commit()

    return category, None


# =========================================================
# DEACTIVATE CATEGORY
# =========================================================
def delete_category(category):

    category.is_active = False

    db.session.commit()

    return category