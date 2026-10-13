from extensions import db
from datetime import datetime


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    category_id = db.Column(
        db.Integer,
        db.ForeignKey("categories.id"),
        nullable=False
    )

    name = db.Column(
        db.String(200),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    price = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    stock_quantity = db.Column(
        db.Integer,
        default=0,
        nullable=False
    )

    image_url = db.Column(
        db.String(500),
        nullable=True
    )

    is_active = db.Column(
        db.Boolean,
        default=True,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    category = db.relationship(
        "Category",
        backref="products"
    )

    def __repr__(self):
        return f"<Product {self.name}>"