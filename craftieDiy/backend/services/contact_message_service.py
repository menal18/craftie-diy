from extensions import db
from models.contact_message import ContactMessage


def create_contact_message(name, email, phone, message):
    if not name or not name.strip():
        return None, "Name is required"

    if not email or not email.strip():
        return None, "Email is required"

    if not message or not message.strip():
        return None, "Message is required"

    contact_message = ContactMessage(
        name=name.strip(),
        email=email.strip(),
        phone=phone.strip() if phone else None,
        message=message.strip(),
        status="new"
    )

    db.session.add(contact_message)
    db.session.commit()

    return contact_message, None


def get_all_contact_messages():
    return ContactMessage.query.order_by(
        ContactMessage.created_at.desc()
    ).all()


def get_contact_message_by_id(message_id):
    return db.session.get(ContactMessage, message_id)


def update_contact_message_status(contact_message, status):
    allowed_statuses = ["new", "read", "replied"]

    if status not in allowed_statuses:
        return None, "Invalid status"

    contact_message.status = status

    db.session.commit()

    return contact_message, None


def delete_contact_message(contact_message):
    db.session.delete(contact_message)
    db.session.commit()

    return True