// frontend/src/api/axios.js
import axios from 'axios';

// Crea una instancia de Axios con una configuración base
const api = axios.create({
    // La base URL para todas las solicitudes realizadas con esta instancia.
    // En desarrollo, apunta a tu backend local.
    // En producción, esto debería cambiarse a la URL de tu backend desplegado.
    baseURL: 'http://localhost:5000/api', // Asegúrate de que esta URL sea correcta
    withCredentials: true, // MUY IMPORTANTE PARA LAS COOKIES DE SESIÓN DE PASSPORT
    // >>>>>>>>>>>>>>> CORRECCIÓN CLAVE AQUÍ: ELIMINAR Content-Type global <<<<<<<<<<<<<<<<
    // Si se envía FormData, Axios automáticamente establecerá 'multipart/form-data'.
    // Si se establece aquí a 'application/json', puede causar conflictos con Multer.
    // headers: {
    //     'Content-Type': 'application/json', // <<<< ¡ELIMINADO!
    // },
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
});

// Interceptor de solicitudes para añadir el token JWT
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Intenta obtener el token de localStorage
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor de respuestas para manejar errores de autenticación
api.interceptors.response.use(
    (response) => response, // Si la respuesta es exitosa, simplemente la pasamos
    (error) => {
        // Si la respuesta es un error y tiene un status
        if (error.response) {
            const { status } = error.response;

            // Manejar 401 Unauthorized (token inválido o expirado)
            // Agregamos una condición para no redirigir si ya estamos intentando loguearnos
            if (status === 401 && !error.config.url.includes('/auth/login')) {
                console.warn('Token inválido o expirado. Redirigiendo a login...');
                // Limpiar el localStorage
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Redirigir al usuario al login con un mensaje.
                window.location.href = '/login?message=session_expired'; 
            }
            // Manejar 403 Forbidden (sin permisos)
            else if (status === 403) {
                console.warn('Acceso denegado. No tienes permisos para esta acción.');
                // Podrías redirigir a una página de "acceso denegado" o mostrar un mensaje
            }
        }
        return Promise.reject(error); // Re-lanzar el error para que el componente que hizo la llamada lo maneje
    }
);

export default api;