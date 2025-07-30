document.addEventListener('DOMContentLoaded', () => {
    const accessToken = localStorage.getItem('access_token');
    const loginLink = document.getElementById('login-link');
    const logoutButton = document.getElementById('logout-link');
    const ventanaEmergente = document.getElementById('ventanaEmergente');
    let listOfAllAmenities = [];

    ventanaEmergente.style.display = 'none';

    /*             -#-#-#-#- LOGICA DE AUTENTICACION -#-#-#-#-
    ----------------------------------------------------------------------------------- */
    async function checkAuthentication() {
        if (accessToken) {
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
        } else {
            if (loginLink) {
                loginLink.style.display = 'block'; // muestra el enlace de login si el usuario no está autenticado
            }
            if (logoutButton) {
                logoutButton.style.display = 'none'; // oculta el botón de logout si el usuario no está autenticado
            }
        }
        
    }

    /*         -#-#-#-#- FUNCION PARA CREAR PLACES -#-#-#-#- 
    ----------------------------------------------------------------------*/
    async function addPlaces() {
        const formAddPlaces = document.getElementById('formAddPlace');
        const formData = new FormData(formAddPlaces);
        const datosDelForm = Object.fromEntries(formData.entries());
        const accessToken = localStorage.getItem('access_token');
        const userId = localStorage.getItem('user_id');
        const datosParaEnviar = {};

        for (const key in datosDelForm) { // creamos un for para recorrer los valores del form
            const value = datosDelForm[key];
            if (key === 'price' || key === 'latitude' || key === 'longitude') {
                datosParaEnviar[key] = parseFloat(value); // parseamos a float todos los valores que deben ser numericos
            } else {
                datosParaEnviar[key] = value;
            }
        }

        datosParaEnviar['owner_id'] = `${userId}`;
        if (!accessToken) {
            console.error('No se encontró el token de acceso para fetchDataUser.');
            checkAuthentication(); // Forzar una re-verificación de autenticación
            return null;
        }
        const url = 'http://127.0.0.1:5000/api/v1/places/';
        const requestOptions = { // preparamos la peticion a la api con los header la url y el body
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(datosParaEnviar)
        };
        try {
            const response = await fetch(url, requestOptions);
            if (!response.ok) { // manejamos la no autorizacion del cliente
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
            const place_id = `${data.id}`; // capturamos el id del nuevo Place
            ventanaEmergente.style.display = 'flex'; // aparece la ventana emergente
            await addPlaceAmenities(accessToken, place_id);
            asociateAmenityToPlace(accessToken, place_id) // llamamos a la funcion para asociar amenities
        } catch (error) {
            console.error('Error f:', error);
        }
    }

    /* -#-#-#-#- FUNCION PARA AÑADIR LAS AMENITIES AL PLACE -#-#-#-#- 
    ------------------------------------------------------------------*/
    async function addPlaceAmenities(accessToken, place_id) {
        const amenityList = document.getElementById('amenityList');
        const amenityItems = document.getElementById('amenityItems');
        const urlAmenities = 'http://127.0.0.1:5000/api/v1/amenities/';
        const requestOptionsGet = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }   // hasta aca capturamos los elementos y preparamos una peticion para la api
        };
        try {
            const response = await fetch(urlAmenities, requestOptionsGet);
            if (!response.ok) { // manejamos la no autorizacion del cliente
                if (response.status === 401) {
                    console.error('Unauthorized access - invalid token');
                    localStorage.removeItem('access_token'); // eliminamos el token de acceso
                    localStorage.removeItem('user_id'); // eliminamos el id del usuario
                    checkAuthentication(); // volvemos a verificar la autenticación
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json(); // obtenemos las amenities
            listOfAllAmenities = []; // creamos una lista para guardar los nombre y poder manejar cuando las amenities ya existen
            amenityList.innerHTML = '';
            data.forEach(amenity => { // mostramos cada amenity dinamicamente
                listOfAllAmenities.push(amenity.name.toLowerCase());
                const li = document.createElement('li');
                li.classList.add('lista-items');
                li.innerHTML = `
                        <p>
                            <span>${amenity.name}</span>
                            <input type="checkbox" name="amenitisCreadas" id="${amenity.name}">
                        </p>
                `;
                amenityList.appendChild(li); // las agregamos al sector donde se deben mostrar
            });
        } catch (error) {
            console.error('Error al obtener amenities:', error);
        }
    }

    async function asociateAmenityToPlace(accessToken, place_id) {
        /*    -#-#-#-#- EVENTO PARA CREAR NUEVOS AMENITIES -#-#-#-#- 
        ----------------------------------------------------------------*/
        const botonCrearAmenity = document.getElementById('botonCrearAmenity');  // logica para cuando tocan el boton de crear amenity
        botonCrearAmenity.addEventListener('click', async () => {
            const url = 'http://127.0.0.1:5000/api/v1/amenities/';
            const nombreNewAmenity = document.getElementById('nombreNewAmenity');
            const nombreAmenityInput = nombreNewAmenity.value.trim().toLowerCase();
            if (!nombreNewAmenity) {  // verificamos si el campo estaba vacio
                alert('Las amenities llevan nombre');
                addPlaceAmenities(accessToken, place_id);
                return
            }
            if (listOfAllAmenities.includes(nombreAmenityInput)) { // verificamos si ya existia
                alert('Amenity existente');
                nombreNewAmenity.value = '';
                return;
            }
            const datosAmenity = { // si llego hasta aca es por que hay que crearla
                name: nombreNewAmenity.value,
                place_id: place_id
            };
            const requestOptPost = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(datosAmenity)
            } // preparamos todo para la peticion
            const response = await fetch(url, requestOptPost);
            if (!response.ok) {
                alert('Las amenities llevan nombre');
                ventanaEmergente.style.display = 'none';
                addPlaceAmenities(accessToken, place_id);
            } else {
                alert('amenity creada con exito');
                nombreNewAmenity.value = '';
                addPlaceAmenities(accessToken, place_id);
            }
        })

        /*  -#-#-#-#- LOGICA PARA ASOCIAR LAS AMENITIES AL PLACE -#-#-#-#-
        ---------------------------------------------------------------------- */
        const addAmenitiesToPlace = document.getElementById('addAmenitiesToPlace');
        if (addAmenitiesToPlace) {
            addAmenitiesToPlace.addEventListener('click', async () => {
                let amenitiesSelected = [];
                let arrayPromesas = [];
                const url = 'http://127.0.0.1:5000/api/v1/amenities/';
                const listCheckbox = document.querySelectorAll('[name="amenitisCreadas"]');
                listCheckbox.forEach(checkbox => {
                    if (checkbox.checked === true) {
                        amenitiesSelected.push(checkbox.id)
                    }
                });
                amenitiesSelected.forEach(amenityName => {
                    const sendDataAmenity = {
                        'name': amenityName,
                        'place_id': place_id 
                    }
                    const requestOptPost = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`
                        },
                        body: JSON.stringify(sendDataAmenity)
                    }
                    const promise = fetch(url, requestOptPost)
                        .then(response => {
                            if (!response.ok) {
                                return response.json().then(errorData => {
                                throw new Error(`Error al asociar "${amenityName}": ${response.status} - ${errorData.message || response.statusText}`)
                                })
                            }
                            return response.json();
                    })
                    .catch(error => {
                        console.error('Error: ', error)
                        alert('Error en el servidor')
                        throw error;
                    });
                    arrayPromesas.push(promise);
                });
                try {
                    await Promise.all(arrayPromesas);
                    alert('place creado exitosamente');
                    window.location.href = '/';
                } catch (error) {
                    console.error('Error en una o varias solicitudes:', error);
                    alert(`Hubo un error al asociar una o más amenities. Revisa la consola para más detalles.\n${error.message}`);
                }
            });
        }        
    }

    

    // logica para enviar el formulario de Places cuando tocan el boton crear
    const formAddPlace = document.getElementById('formAddPlace');
    if (formAddPlace) {
        formAddPlace.addEventListener('submit', async (event) => {
            event.preventDefault();
            await addPlaces();
        });
    }
    checkAuthentication();
});