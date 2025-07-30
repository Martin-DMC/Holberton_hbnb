"""
in this module we init the app package
"""
from flask import Flask, render_template
from flask_restx import Api
from flask_cors import CORS
from app.extensions import bcrypt, jwt, db
from flask import render_template

from app.api.v1.users import api as users_ns
from app.api.v1.places import api as places_ns
from app.api.v1.amenities import api as amenities_ns
from app.api.v1.reviews import api as reviews_ns
from app.api.v1.auth import api as auth_ns
from app.api.v1.reservas import api as reservas_ns

def create_app(config_class):
    app = Flask(__name__, template_folder='templates', static_folder='static')
    app.config.from_object(config_class)
    app.config['JWT_SECRET_KEY'] = 'mi-clave-supersecreta'

    # Inicialización de extensiones
    jwt.init_app(app)
    bcrypt.init_app(app)
    db.init_app(app)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Ruta pagina principal
    @app.route('/')
    def index():
        "sirve la pagina principal index.html"
        return render_template('index.html')
    
    @app.route('/login')
    def login():
        """Sirve la página de inicio de sesión (login.html)."""
        return render_template('login.html')
    
    @app.route('/places')
    def place_page():
        """Sirve la página de detalles del lugar (place.html)."""
        return render_template('place.html')

    @app.route('/profile')
    def profile():
        """Sirve la página del perfil personal (profile.html)."""
        return render_template('profile.html')

    @app.route('/addPlace')
    def addPlaces():
        """Sirve la página para añadir places (add.places.html)."""
        return render_template('add-places.html')

    # API RESTX
    api = Api(app, version='1.0', title='HBnB API', description='HBnB Application API', doc='/docs/')

    
    # Rutas
    api.add_namespace(users_ns, path='/api/v1/users')
    api.add_namespace(places_ns, path='/api/v1/places')
    api.add_namespace(amenities_ns, path='/api/v1/amenities')
    api.add_namespace(reviews_ns, path='/api/v1/reviews')
    api.add_namespace(auth_ns, path='/api/v1/auth')
    api.add_namespace(reservas_ns, path='/api/v1/reservas')

    return app
