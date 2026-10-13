from extensions import db
from datetime import datetime


class Address(db.Model):
    __tablename__ = "addresses"

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

    full_name = db.Column(
        db.String(150),
        nullable=False
    )

    phone = db.Column(
        db.String(20),
        nullable=False
    )

    address_line1 = db.Column(
        db.String(255),
        nullable=False
    )

    address_line2 = db.Column(
        db.String(255),
        nullable=True
    )

    city = db.Column(
        db.String(100),
        nullable=False
    )

    state = db.Column(
        db.String(100),
        nullable=False
    )

    postal_code = db.Column(
        db.String(20),
        nullable=False
    )

    country = db.Column(
        db.String(100),
        nullable=False,
        default="India"
    )

    address_type = db.Column(
        db.String(20),
        nullable=False,
        default="home"
    )

    is_default = db.Column(
        db.Boolean,
        default=False,
        nullable=False
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
        backref=db.backref(
            "addresses",
            lazy=True,
            cascade="all, delete-orphan"
        )
    )

    def __repr__(self):
        return f"<Address {self.id} - {self.full_name}>"