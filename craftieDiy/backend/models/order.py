from extensions import db
from datetime import datetime, timezone


def utc_now_naive():
    """Return UTC without tzinfo for storage in MySQL DATETIME columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def utc_timestamp_iso(value):
    """Serialize stored UTC timestamps with an explicit UTC offset."""
    if value is None:
        return None

    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)

    return value.isoformat().replace("+00:00", "Z")


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    order_number = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    address_id = db.Column(
        db.Integer,
        db.ForeignKey("addresses.id"),
        nullable=True
    )

    subtotal = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        default=0
    )

    delivery_charge = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        default=0
    )

    promotion_discount = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        default=0
    )

    promo_code_id = db.Column(
        db.Integer,
        db.ForeignKey("promo_codes.id", ondelete="SET NULL"),
        nullable=True
    )

    promo_code_discount = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        default=0
    )

    discount = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        default=0
    )

    total = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        default=0
    )

    payment_method = db.Column(
        db.String(30),
        nullable=False,
        default="COD"
    )

    payment_status = db.Column(
        db.String(30),
        nullable=False,
        default="pending"
    )

    order_status = db.Column(
        db.String(30),
        nullable=False,
        default="pending"
    )

    notes = db.Column(
        db.Text,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=utc_now_naive,
        nullable=False
    )

    updated_at = db.Column(
        db.DateTime,
        default=utc_now_naive,
        onupdate=utc_now_naive,
        nullable=False
    )

    user = db.relationship(
        "User",
        backref=db.backref(
            "orders",
            lazy=True
        )
    )

    address = db.relationship(
        "Address",
        backref=db.backref(
            "orders",
            lazy=True
        )
    )

    promo_code = db.relationship(
        "PromoCode",
        backref=db.backref(
            "orders",
            lazy=True
        )
    )

    def __repr__(self):
        return f"<Order {self.order_number}>"