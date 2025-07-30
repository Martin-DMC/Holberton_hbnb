document.addEventListener('DOMContentLoaded', () => {
    const loginLink = document.getElementById('login-link');
    const logoutButton = document.getElementById('logout-link');
    const sectorInfoUser = document.getElementById('info-of-user');
    const sectorPlacesUser = document.getElementById('places-of-user');
    const fullNombreUser = document.getElementById('full-name-user');

    /*##########################################################
    -------------- LOGICA DE AUTENTICACION ---------------------
    ############################################################*/

    // #-#-# función para verificar la autenticación #-#-#
    async function checkAuthentication() {
        const accessToken = localStorage.getItem('access_token');
        const userId = localStorage.getItem('user_id');

        if (accessToken && userId) {
            if (loginLink) {
                loginLink.style.display = 'none'; // ocultamos el enlace de login si el usuario ya está autenticado
            }
            if (logoutButton) {
                logoutButton.style.display = 'block';
                logoutButton.onclick = () => { // detectamos el cierre de sesión
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user_id');      // eliminamos el token de acceso y el id del almacenamiento local
                    window.location.reload();               // redirigimos al usuario a la página principal
                };
            }
            renderDetails(userId);
            opcionesFooter();
        } else {
            if (loginLink) {
                loginLink.style.display = 'block'; // mostramos el enlace de login si el usuario no está autenticado
            }
            if (logoutButton) {
                logoutButton.style.display = 'none'; // ocultamos el botón de logout si el usuario no está autenticado
            }
            if (fullNombreUser) { // verificamos si el elemento existe
                fullNombreUser.innerText = 'Por favor, inicie sesión para ver su perfil.';
            }
            if (sectorInfoUser) {
                 sectorInfoUser.innerHTML = ''; // Limpia el contenido si hay algo previo
            }
            if (sectorPlacesUser) {
                sectorPlacesUser.innerHTML = ''; // Limpia el contenido si hay algo previo
            }
        }
    }
    async function fetchDataUser(userId) {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            console.error('No se encontró el token de acceso para fetchDataUser.');
            checkAuthentication(); // Forzar una re-verificación de autenticación
            return null;
        }
        const url = `http://localhost:5000/api/v1/users/${userId}`;
        const requestOptions = { // creamos un header general
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        };
        try {
            const response = await fetch(url, requestOptions);
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
            return data; // devolvemos los datos del usuario
        } catch (error) {
            console.error('Error fetching place details:', error);
            //mostramos un mensaje de error en vez del nombre del usuario
            if (fullNombreUser) {
                fullNombreUser.innerText = 'Error al cargar los datos.';
            }
            return null; // devolvemos null en caso de error
        }
    }
    async function renderDetails(userId) {
        const user = await fetchDataUser(userId);

        if (user === null) {
            if (fullNombreUser) {
                fullNombreUser.innerText = 'No se pudo cargar la información del perfil.';
            }
            return;
        }
        if (fullNombreUser) {
            fullNombreUser.innerText = `${user.first_name} ${user.last_name}`; // mostramos el nombre en el header
            sectorInfoUser.innerHTML = `
                                    <fieldset><legend><b>First Name: </b></legend><p class="data-api">${user.first_name}</p></fieldset>
                                    <br>
                                    <fieldset><legend><b>Last Name: </b></legend><p class="data-api">${user.last_name}</p></fieldset>
                                    <br>
                                    <fieldset><legend><b>Email: </b></legend><p class="data-api">${user.email}</p></fieldset>
                                `;
        }
    }
    async function opcionesFooter() {
        const botonEditar = document.getElementById('botonEditar');
        const dialogEditar = document.getElementById('dialogoEditar');
        const cerrarDialogoEditar = document.getElementById('cerrarDialogoEditar');
        const formActualizarPerfil = document.getElementById('form-update-perfil')

        botonEditar.addEventListener('click', () => {
            dialogEditar.showModal();
        });
        cerrarDialogoEditar.addEventListener('click', () => {
            dialogEditar.close();
        });
        formActualizarPerfil.addEventListener('submit', async (event) => {
            event.preventDefault();
            const accessToken = localStorage.getItem('access_token');
            const userId = localStorage.getItem('user_id');
            const formData = new FormData(formActualizarPerfil);
            const datosDelForm = Object.fromEntries(formData.entries());
            const datosParaEnviar = {};

            for (const key in datosDelForm) {
                const value = datosDelForm[key];
                if (value !== '' && value !== null && value !== undefined) {
                    datosParaEnviar[key] = value;
                }
            }


            try {
                const urlUpdate = `http://127.0.0.1:5000/api/v1/users/${userId}`;
                const response = await fetch(urlUpdate, {
                    method: 'PUT', // para enviar los datos
                    headers: {
                        'Content-Type': 'application/json', // para enviarlos en JSON
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify(datosParaEnviar)
                });
                const data = await response.json(); //se parsea la respuesta json del server
                if (response.ok){
                    console.log('update exitoso:', data);
                    alert('¡Update exitoso!');
                    // se redirige al usuario al index.html
                    dialogEditar.close();
                    await renderDetails(userId);
                } else {
                    console.error('Error en el registro:', data.error);
                    alert(data.error || 'Error desconocido en el registro.');
                    dialogEditar.close();
                }
            } catch (error) {
            // Captura errores de red
            console.error('Error de red o del servidor:', error);
            alert('No se pudo conectar con el servidor. Verifica tu conexión o la URL de la API.');
            dialogEditar.close();
            }
        });
    }
    checkAuthentication();
});