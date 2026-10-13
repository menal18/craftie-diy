from datetime import datetime

from sqlalchemy import UniqueConstraint

from extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "idempotency_key",
            name="uq_notifications_user_idempotency_key"
        ),
    )

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

    title = db.Column(
        db.String(200),
        nullable=False
    )

    message = db.Column(
        db.Text,
        nullable=False
    )

    notification_type = db.Column(
        db.String(50),
        nullable=False,
        default="general"
    )

    reference_id = db.Column(
        db.Integer,
        nullable=True
    )

    idempotency_key = db.Column(
        db.String(80),
        nullable=True
    )

    email_status = db.Column(
        db.String(20),
        nullable=True
    )

    email_error = db.Column(
        db.Text,
        nullable=True
    )

    is_read = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    user = db.relationship(
        "User",
        backref=db.backref("notifications", lazy=True)
    )

    def __repr__(self):
        return f"<Notification {self.id}>"