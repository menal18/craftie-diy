from extensions import db
from models.product_image import ProductImage
from models.product import Product


def get_product_images(product_id):

    product = db.session.get(Product, product_id)

    if not product:
        return None, "Product not found"

    images = ProductImage.query.filter_by(
        product_id=product_id
    ).order_by(
        ProductImage.display_order.asc(),
        ProductImage.created_at.asc()
    ).all()

    return images, None


def get_product_image_by_id(image_id):

    return db.session.get(
        ProductImage,
        image_id
    )


def create_product_image(
    product_id,
    image_url,
    is_primary=False,
    display_order=0
):

    if not image_url:
        return None, "Image URL is required"

    product = db.session.get(
        Product,
        product_id
    )

    if not product:
        return None, "Product not found"

    try:
        display_order = int(display_order)
    except (ValueError, TypeError):
        return None, "Invalid display order"

    if display_order < 0:
        return None, "Display order cannot be negative"

    # A primary upload from the single-image admin form replaces the
    # existing primary record instead of accumulating duplicate records.
    if is_primary:
        primary_image = ProductImage.query.filter_by(
            product_id=product_id,
            is_primary=True
        ).order_by(
            ProductImage.id.asc()
        ).first()

        if primary_image:
            try:
                ProductImage.query.filter(
                    ProductImage.product_id == product_id,
                    ProductImage.id != primary_image.id,
                    ProductImage.is_primary.is_(True)
                ).update({
                    "is_primary": False
                })
                primary_image.image_url = image_url
                primary_image.display_order = display_order
                db.session.commit()
            except Exception as error:
                db.session.rollback()
                return None, str(error)

            return primary_image, None

    image = ProductImage(
        product_id=product_id,
        image_url=image_url,
        is_primary=bool(is_primary),
        display_order=display_order
    )

    db.session.add(image)
    try:
        db.session.commit()
    except Exception as error:
        db.session.rollback()
        return None, str(error)

    return image, None


def update_product_image(
    image,
    image_url=None,
    is_primary=None,
    display_order=None
):

    if image_url is not None:

        if not image_url:
            return None, "Image URL cannot be empty"

        image.image_url = image_url

    if is_primary is not None:

        if is_primary:
            ProductImage.query.filter(
                ProductImage.product_id == image.product_id,
                ProductImage.id != image.id,
                ProductImage.is_primary == True
            ).update({
                "is_primary": False
            })

        image.is_primary = bool(is_primary)

    if display_order is not None:

        try:
            display_order = int(display_order)
        except (ValueError, TypeError):
            return None, "Invalid display order"

        if display_order < 0:
            return None, "Display order cannot be negative"

        image.display_order = display_order

    db.session.commit()

    return image, None


def delete_product_image(image):

    db.session.delete(image)
    db.session.commit()

    return True