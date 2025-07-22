// axios.js
import axios from 'axios';

// Crea una instancia de Axios
const api = axios.create({
  baseURL: 'http://localhost:5000/api' , // Asegúrate de que esta sea la URL de tu backend
});

// Interceptor para añadir el token a cada solicitud saliente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Intenta obtener el token de localStorage

    if (token) {
      // Si el token existe, lo añade a la cabecera Authorization
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta (401, 403)
api.interceptors.response.use(
  (response) => response, // Si la respuesta es exitosa, simplemente la pasamos
  async (error) => {
    // Si la respuesta es un error
    if (error.response) {
      const { status } = error.response;

      // Manejar 401 Unauthorized (token inválido o expirado)
      if (status === 401) {
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