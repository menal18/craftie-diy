from extensions import db
from datetime import datetime


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    order_id = db.Column(
        db.Integer,
        db.ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True
    )

    # Product snapshot at the time of purchase
    product_name = db.Column(
        db.String(200),
        nullable=False
    )

    quantity = db.Column(
        db.Integer,
        nullable=False,
        default=1
    )

    unit_price = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    subtotal = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        default=0
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    order = db.relationship(
        "Order",
        backref=db.backref(
            "items",
            lazy=True,
            cascade="all, delete-orphan"
        )
    )

    product = db.relationship(
        "Product",
        backref=db.backref("order_items", lazy=True)
    )

    def __repr__(self):
        return f"<OrderItem {self.id}>"