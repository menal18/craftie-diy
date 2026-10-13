from extensions import db
from datetime import datetime


class ProductImage(db.Model):
    __tablename__ = "product_images"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False
    )

    image_url = db.Column(
        db.String(500),
        nullable=False
    )

    is_primary = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    display_order = db.Column(
        db.Integer,
        default=0,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    product = db.relationship(
        "Product",
        backref=db.backref(
            "images",
            lazy=True,
            cascade="all, delete-orphan"
        )
    )

    def __repr__(self):
        return f"<ProductImage {self.id}>"