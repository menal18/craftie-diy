from extensions import db
from datetime import datetime


class PromoCode(db.Model):
    __tablename__ = "promo_codes"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    code = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    description = db.Column(
        db.String(255),
        nullable=True
    )

    discount_type = db.Column(
        db.String(20),
        nullable=False,
        default="percentage"
    )

    discount_value = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        default=0
    )

    minimum_order_value = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        default=0
    )

    maximum_discount = db.Column(
        db.Numeric(10, 2),
        nullable=True
    )

    usage_limit = db.Column(
        db.Integer,
        nullable=True
    )

    per_user_limit = db.Column(
        db.Integer,
        nullable=True
    )

    used_count = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    start_date = db.Column(
        db.DateTime,
        nullable=False
    )

    end_date = db.Column(
        db.DateTime,
        nullable=False
    )

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True
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

    def __repr__(self):
        return f"<PromoCode {self.code}>"