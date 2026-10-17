

from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

from extensions import db
from models.user import User


# =========================================================
# REGISTER USER
# =========================================================
def register_user(name, email, phone, password):

    if not name:
        return None, "Name is required"

    if not email:
        return None, "Email is required"

    if not password:
        return None, "Password is required"

    email = email.lower().strip()
    name = name.strip()

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return None, "Email already registered"

    user = User(
        name=name,
        email=email,
        phone=phone,
        password_hash=generate_password_hash(password),
        role="customer"
    )

    db.session.add(user)
    db.session.commit()

    return user, None


# =========================================================
# LOGIN USER
# =========================================================
def login_user(email, password):

    if not email:
        return None, None, "Email is required"

    if not password:
        return None, None, "Password is required"

    email = email.lower().strip()

    user = User.query.filter_by(email=email).first()

    if not user:
        return None, None, "Invalid email or password"

    if not check_password_hash(user.password_hash, password):
        return None, None, "Invalid email or password"

    access_token = create_access_token(
        identity=str(user.id)
    )

    return user, access_token, None


# =========================================================
# GET USER BY ID
# =========================================================
def get_user_by_id(user_id):

    user = db.session.get(User, user_id)

    if not user:
        return None

    return user