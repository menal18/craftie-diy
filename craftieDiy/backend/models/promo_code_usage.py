from extensions import db
from datetime import datetime


class PromoCodeUsage(db.Model):
    __tablename__ = "promo_code_usage"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    promo_code_id = db.Column(
        db.Integer,
        db.ForeignKey("promo_codes.id", ondelete="CASCADE"),
        nullable=False
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    order_id = db.Column(
        db.Integer,
        db.ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False
    )

    discount_amount = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        default=0
    )

    used_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    promo_code = db.relationship(
        "PromoCode",
        backref=db.backref("usages", lazy=True)
    )

    user = db.relationship(
        "User",
        backref=db.backref("promo_code_usages", lazy=True)
    )

    order = db.relationship(
        "Order",
        backref=db.backref("promo_code_usage", uselist=False)
    )

    def __repr__(self):
        return f"<PromoCodeUsage {self.id}>"