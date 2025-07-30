/*##################################################
-------------- LOGICA estrellas -------------
####################################################*/
function getStarRatingHtml(rating, maxStars = 5) {
    let starsHtml = '';
    const roundedRating = Math.round(rating); // Redondeamos el rating para estrellas completas

    // Estrellas llenas
    for (let i = 0; i < roundedRating; i++) {
        starsHtml += '<span class="star filled">★</span>';
    }

    // Estrellas vacías
    for (let i = roundedRating; i < maxStars; i++) {
        starsHtml += '<span class="star empty">☆</span>';
    }
    return starsHtml;
}

// ------------ DOMContentLoaded ---------------
document.addEventListener('DOMContentLoaded', () => {
    const accessToken = localStorage.getItem('access_token');
    const loginLink = document.getElementById('login-link');
    const logoutButton = document.getElementById('logout-link');
    const placesDetails = document.getElementById('place-details');
    const detailShow = document.getElementById('details-show');
    const addReviewSection = document.getElementById('add-review');
    const placeId = new URLSearchParams(window.location.search).get('id'); // obtenemos el id del lugar desde la URL
    const url = 'http://localhost:5000/api/v1/places/';

    const requestOptions = { // creamos un header general
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    };
    if (accessToken) {
        requestOptions.headers['Authorization'] = `Bearer ${accessToken}`; // Añadimos el token de acceso a las cabeceras
    }
    /*##################################################
    -------------- LOGICA DE AUTENTICACION -------------
    ####################################################*/

    // #-#-# función para verificar la autenticación #-#-#
    async function checkAuthentication() {
        if (accessToken) {
            addReviewSection.style.display = 'block'; // muestra la sección de añadir reseña si el usuario está autenticado
            if (loginLink) {
                loginLink.style.display = 'none'; //se oculta boton login
            }
            if (logoutButton) {
                logoutButton.style.display = 'block';
                logoutButton.onclick = () => {  // detecta cierre de sesión
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user_id'); // elimina el token de acceso y el id del almacenamiento local
                    window.location.href = '/login'; // redirige al usuario a la página principal
                };
            }
            // si esta autenticado
            renderDetalles();
        } else {
            addReviewSection.style.display = 'none'; // oculta la sección de añadir reseña si el usuario no está autenticado
            if (loginLink) {
                loginLink.style.display = 'block'; // muestra el enlace de login si el usuario no está autenticado
            }
            if (logoutButton) {
                logoutButton.style.display = 'none'; // oculta el botón de logout si el usuario no está autenticado
            }
            // si no hay token de acceso, muestra un mensaje de iniciar sesion 
            placesDetails.innerHTML = '<p class="error-message">Por favor, inicie sesión.</p>';
        }
        
    }
    /*##################################################
    -------------- LOGICA DETALLES PLACES --------------
    ####################################################*/

    // #-#-# Función para obtener los datos desde la API #-#-#

    async function FetchPlacesById(accessToken, placeId) {
        try {
            const urlOfPlace = `${url}${placeId}`;
            const response = await fetch(urlOfPlace, requestOptions);
            
            if (!response.ok) {
                // manejamos la no autorizacion del cliente
                if (response.status === 401) {
                    console.error('Unauthorized access - invalid token');
                    localStorage.removeItem('access_token'); // eliminamos el token de acceso
                    localStorage.removeItem('user_id'); // eliminamos el id del usuario
                    checkAuthentication(); // volvemos a verificar la autenticación
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data; // devolvemos los datos del lugar
        } catch (error) {
            console.error('Error fetching place details:', error);
            //mostramos un mensaje de error en la sección de detalles del lugar
            placesDetails.innerHTML = '<p class="error-message">Error al cargar los detalles del place.</p>';
            return null; // devolvemos null en caso de error
        }
    }

    // #-#-# Función para renderizar los detalles del lugar #-#-#

    async function renderDetalles() {
        const place = await FetchPlacesById(accessToken, placeId);

        if (place === null) {
            detailShow.innerHTML = '<p class="error-message">No se pudo cargar el lugar.</p>';
            return; // mensaje de error y salimos de la función
        }
        const titleElement = document.createElement('h2');
        const reviewsSection = document.getElementById('container')
        titleElement.textContent = place.title;
        placesDetails.appendChild(titleElement);
        detailShow.innerHTML = ''; // Limpiamos el contenido previo

        const amenitiesList = place.amenities && place.amenities.length > 0 ? place.amenities.map(amenity => amenity.name).join(', ') : 'No amenities listed';

        detailShow.innerHTML += `
            <p class="place-owner"><b>Host: </b>${place.owner_id.first_name} ${place.owner_id.last_name}</h5>
            <p class="place-price"><b>Price per night: </b>$${place.price}</p>
            <p class="place-description"><b>Description: </b>${place.description}</p>
            <p class="amenities"><b>Amenities: </b>${amenitiesList}</p>
        `;

        /*##################################################
        ----------------- LOGICA REVIEWS -------------------
        ####################################################*/
        if (place.reviews && place.reviews.length > 0) {
            const listReviews = place.reviews;
            reviewsSection.innerHTML = '';
            const reviewWithUserName = await Promise.all(listReviews.map(async (review) => {
                const userResponse = await fetch(`http://localhost:5000/api/v1/users/${review.user_id}`, requestOptions);
                const userData = await userResponse.json();
                return {
                    ... review,
                    user_name: userData.first_name,
                    user_apellido: userData.last_name
                };
            }));
            reviewWithUserName.forEach(review => {
                const div = document.createElement('div');
                div.classList.add('reviews-list');

                div.innerHTML = `
                <h3 class="name-user"><b>${review.user_name} ${review.user_apellido}:</b></h3>
                <p class="review-text">${review.text}</p>
                <p class="review-rating">${getStarRatingHtml(review.rating)}</p>
                `;
                reviewsSection.appendChild(div);
            });
        } else {
            reviewsSection.innerText = 'Aun no contiene reviews';
        }
    }
    async function addReviews() {
        const formReview = document.getElementById('review-form') //formulario
        const reviewText = document.getElementById('review-text')  //texto
        const reviewRating = document.getElementById('stars_rating') //rating

        if (!formReview){
            console.error('Error: el elemenco con id "review-form" no fue encontrado');
            return
        }
        function autoResizeReviewTextArea() {
            if (reviewText) { // verificamos que reviewText existe
                reviewText.style.height = '25px';
                reviewText.style.height = reviewText.scrollHeight + 'px';
            }
        }

        // Asignar el event listener y llamar la primera vez
        if (reviewText) { // verificamos que reviewText existe antes de añadir listeners
            reviewText.addEventListener('input', autoResizeReviewTextArea);
            autoResizeReviewTextArea(); // Para ajustar si ya hay contenido al cargar
        }
        formReview.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log('submit event prevented!')

            const textReview = reviewText.value;
            const ratingReview = parseInt(reviewRating.value, 10);
            if (!textReview.trim()) {
                alert('Por favor, escriba un comentario');
                return;
            }
            if (isNaN(ratingReview) || ratingReview < 1 || ratingReview > 5) {
                alert('Por favor seleccione una calificacion');
                return;
            }
            try {
                const postRequestOption = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ 
                    'user_id': localStorage.getItem('user_id'),
                    'place_id': placeId,
                    'text': textReview,
                    'rating': ratingReview
                    })
                };
                const response = await fetch('http://127.0.0.1:5000/api/v1/reviews/', postRequestOption);
                if (!response.ok) {
                    // manejamos la no autorizacion del cliente
                    if (response.status === 401) {
                        console.error('Unauthorized access - invalid token');
                        localStorage.removeItem('access_token'); // eliminamos el token de acceso
                        localStorage.removeItem('user_id'); // eliminamos el id del usuario
                        checkAuthentication(); // volvemos a verificar la autenticación
                        return null;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (response.ok){
                    alert('review create successful');
                    window.location.reload();
                } else {
                    alert(data.error || 'problemas tecnicos')
                }
            } catch (error) {
                alert('No se pudo conectar con el servidor. Verifica tu conexión o la URL de la API.');
            }
        });
    }
    const botonHacerReserva = document.getElementById('hacerReserva');
    const closeVentanaEmergente = document.getElementById('closeVentanaEmergente');
    const ventanaEmergente = document.getElementById('ventanaEmergente');
    ventanaEmergente.style.display = 'none';
    botonHacerReserva.addEventListener('click', () => {
            ventanaEmergente.style.display = 'flex'
    });
    closeVentanaEmergente.addEventListener('click', () => {
            ventanaEmergente.style.display = 'none'
    });
    const userId = localStorage.getItem('user_id');
    const formReserva = document.getElementById('formReserva');

    formReserva.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(formReserva);
        const datosDelForm = Object.fromEntries(formData.entries());
        const datosParaEnviar = {};
        for (const key in datosDelForm) { // creamos un for para recorrer los valores entregados
            const value = datosDelForm[key];
            datosParaEnviar[key] = value;
        }
        datosParaEnviar['user_id'] = userId;
        datosParaEnviar['place_id'] = placeId;

        if (!accessToken) {
            console.error('No se encontró el token de acceso.');
            checkAuthentication(); // Forzar una re-verificación de autenticación
            return null;
        }

        const url = 'http://127.0.0.1:5000/api/v1/reservas/';
        const requestOptionsPost = { // preparamos la peticion
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(datosParaEnviar)
        };
        try {
            const response = await fetch(url, requestOptionsPost);
            if (!response.ok) { // manejamos la no autorizacion del cliente
                if (response.status === 401) {
                    console.error('Unauthorized access - invalid token');
                    localStorage.removeItem('access_token'); // eliminamos el token de acceso
                    localStorage.removeItem('user_id'); // eliminamos el id del usuario
                    checkAuthentication(); // volvemos a verificar la autenticación
                    return null;
                }
                const data = await response.json();
                alert(`Error: ${data.error}`);
                return;
            }
            alert('reserva exitosa');
            ventanaEmergente.style.display = 'none';
        } catch (error) {
            console.error('Error f:', error);
        }
    })
    // llamada principal para que todo ande
    checkAuthentication();
    addReviews();
});