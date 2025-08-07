// frontend/src/api/axios.js
import axios from 'axios';

// Crea una instancia de Axios con una configuración base
const api = axios.create({
    // La base URL para todas las solicitudes realizadas con esta instancia.
    // Esta URL ha sido actualizada para apuntar a tu backend desplegado en Render.
    baseURL: 'https://carniceria-api-vmy1.onrender.com/api', 
    withCredentials: true, // MUY IMPORTANTE PARA LAS COOKIES DE SESIÓN DE PASSPORT
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
            }
        }
        return Promise.reject(error); // Re-lanzar el error para que el componente que hizo la llamada lo maneje
    }
);

export default api;