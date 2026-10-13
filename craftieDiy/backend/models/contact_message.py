from extensions import db
from datetime import datetime


class ContactMessage(db.Model):
    __tablename__ = "contact_messages"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    name = db.Column(
        db.String(150),
        nullable=False
    )

    email = db.Column(
        db.String(150),
        nullable=False
    )

    phone = db.Column(
        db.String(30),
        nullable=True
    )

    message = db.Column(
        db.Text,
        nullable=False
    )

    status = db.Column(
        db.String(30),
        default="new",
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    def __repr__(self):
        return f"<ContactMessage {self.id}>"