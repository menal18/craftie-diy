from extensions import db
from datetime import datetime


class Payment(db.Model):
    __tablename__ = "payments"

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

    payment_method = db.Column(
        db.String(30),
        nullable=False
    )

    transaction_id = db.Column(
        db.String(150),
        nullable=True
    )

    amount = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    currency = db.Column(
        db.String(10),
        nullable=False,
        default="INR"
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="pending"
    )

    payment_date = db.Column(
        db.DateTime,
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

    order = db.relationship(
        "Order",
        backref=db.backref("payments", lazy=True)
    )

    def __repr__(self):
        return f"<Payment {self.id}>"