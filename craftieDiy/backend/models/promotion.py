from extensions import db
from datetime import datetime


class Promotion(db.Model):
    __tablename__ = "promotions"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    name = db.Column(
        db.String(150),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False
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

    product = db.relationship(
        "Product",
        backref=db.backref("promotions", lazy=True)
    )

    def __repr__(self):
        return f"<Promotion {self.name}>"