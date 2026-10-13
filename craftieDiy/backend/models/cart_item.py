from extensions import db
from datetime import datetime


class CartItem(db.Model):
    __tablename__ = "cart_items"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    cart_id = db.Column(
        db.Integer,
        db.ForeignKey("carts.id", ondelete="CASCADE"),
        nullable=False
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False
    )

    quantity = db.Column(
        db.Integer,
        nullable=False,
        default=1
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    cart = db.relationship(
        "Cart",
        backref=db.backref(
            "items",
            lazy=True,
            cascade="all, delete-orphan"
        )
    )

    product = db.relationship(
        "Product",
        backref=db.backref(
            "cart_items",
            lazy=True
        )
    )

    __table_args__ = (
        db.UniqueConstraint(
            "cart_id",
            "product_id",
            name="unique_cart_product"
        ),
    )

    def __repr__(self):
        return f"<CartItem cart={self.cart_id} product={self.product_id}>"