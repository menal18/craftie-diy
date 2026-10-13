from flask import Flask, jsonify, request

from config import Config
from extensions import db, jwt, cors,mail
from models.user import User
from models.category import Category
from models.product import Product
from models.product_image import ProductImage
from models.wishlist import Wishlist
from models.cart import Cart
from models.cart_item import CartItem
from models.address import Address
from models.order import Order
from models.order_item import OrderItem
from models.review import Review
from models.promotion import Promotion
from models.custom_order import CustomOrder
from models.payment import Payment
from models.promo_code import PromoCode
from models.promo_code_usage import PromoCodeUsage
from models.notification import Notification
from models.contact_message import ContactMessage
from routes.auth_routes import auth_bp
from routes.category_routes import category_bp
from routes.product_routes import product_bp
from routes.product_image_routes import product_image_bp
from routes.wishlist_routes import wishlist_bp
from routes.cart_routes import cart_bp
from routes.address_routes import address_bp
from routes.order_routes import order_bp
from routes.review_routes import review_bp
from routes.promo_code_routes import promo_code_bp
from routes.custom_order_routes import custom_order_bp
from routes.payment_routes import payment_bp
from routes.notification_routes import notification_bp
from routes.admin_routes import admin_bp
from routes.contact_message_routes import contact_message_bp
from routes.promotion_routes import promotion_bp

def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    # cors(app)
    cors(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ]
        }
    },
    supports_credentials=True,
)

    @jwt.unauthorized_loader
    def handle_missing_token(reason):
        app.logger.warning(
            "JWT missing for %s %s: %s",
            request.method,
            request.path,
            reason
        )
        return jsonify({"message": "Authentication token is required"}), 401

    @jwt.invalid_token_loader
    def handle_invalid_token(reason):
        app.logger.warning(
            "JWT invalid for %s %s: %s",
            request.method,
            request.path,
            reason
        )
        return jsonify({"message": "Invalid authentication token"}), 401

    @jwt.expired_token_loader
    def handle_expired_token(jwt_header, jwt_payload):
        app.logger.warning(
            "JWT expired for %s %s",
            request.method,
            request.path
        )
        return jsonify({"message": "Authentication token has expired"}), 401

    app.register_blueprint(auth_bp)
    app.register_blueprint(contact_message_bp)
    app.register_blueprint(category_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(product_image_bp)
    app.register_blueprint(wishlist_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(address_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(review_bp)
    app.register_blueprint(promo_code_bp)
    app.register_blueprint(custom_order_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(promotion_bp)
    

    @app.route("/")
    def home():
        return jsonify({
            "message": "CraftieDIY API is running"
        })
    with app.app_context():
        db.create_all()

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )