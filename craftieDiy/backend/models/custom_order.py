from extensions import db
from datetime import datetime


class CustomOrder(db.Model):
    __tablename__ = "custom_orders"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True
    )

    title = db.Column(
        db.String(200),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=False
    )

    customization_details = db.Column(
        db.Text,
        nullable=True
    )

    reference_image_url = db.Column(
        db.String(500),
        nullable=True
    )

    quantity = db.Column(
        db.Integer,
        nullable=False,
        default=1
    )

    estimated_price = db.Column(
        db.Numeric(10, 2),
        nullable=True
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="pending"
    )

    admin_notes = db.Column(
        db.Text,
        nullable=True
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

    user = db.relationship(
        "User",
        backref=db.backref("custom_orders", lazy=True)
    )

    product = db.relationship(
        "Product",
        backref=db.backref("custom_orders", lazy=True)
    )

    def __repr__(self):
        return f"<CustomOrder {self.id}>"