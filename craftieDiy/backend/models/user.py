from extensions import db
from datetime import datetime


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    name = db.Column(db.String(100), nullable=False)

    email = db.Column(
        db.String(150),
        unique=True,
        nullable=False
    )

    phone = db.Column(db.String(20), nullable=True)

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    role = db.Column(
        db.String(20),
        nullable=False,
        default="customer"
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    def __repr__(self):
        return f"<User {self.email}>"