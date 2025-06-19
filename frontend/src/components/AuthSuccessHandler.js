import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthSuccessHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth(); // Obtener también isAuthenticated

  useEffect(() => {
    // Si ya estamos autenticados y no estamos en la URL con parámetros de token,
    // o si el token ya ha sido procesado, no hacer nada aquí.
    if (isAuthenticated && !location.search.includes('token=')) {
        // console.log('AuthSuccessHandler: Ya autenticado y sin token en URL. No se requiere acción.');
        return;
    }

    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    console.log('AuthSuccessHandler: Token JWT recibido:', token ? 'Existe' : 'No existe');

    if (token) {
      // Intenta obtener datos de la URL si están presentes (como en Google OAuth)
      const userFromUrl = {};
      for (let [key, value] of params.entries()) {
        if (key !== 'token') { // Excluir el token mismo
          userFromUrl[key] = value;
        }
      }

      console.log('AuthSuccessHandler: Datos de usuario de URL:', userFromUrl);

      // Usar los datos de userFromUrl directamente o decodificar el token si es necesario
      login(token, userFromUrl); // Llama a la función login del AuthContext

      // Limpiar los parámetros de la URL para evitar re-procesamientos
      // No podemos limpiar location.search directamente en React Router v6 con navigate
      // Pero podemos redirigir a una URL limpia.
      
      // *** IMPORTANTE: Redirigir a la página que el usuario quería ir ANTES del login,
      // O a un dashboard por defecto.
      // Por ahora, lo mantenemos simple. Si quieres una redirección "inteligente"
      // necesitaríamos guardar la ruta "intended" antes del login.
      navigate('/dashboard', { replace: true });

    } else {
      console.error('AuthSuccessHandler: No se recibió token JWT en la URL.');
      // Si no hay token en la URL, y el usuario no está autenticado, redirigir a login
      if (!isAuthenticated) {
        navigate('/login', { replace: true });
      } else {
        // Si ya está autenticado pero llega aquí sin token, simplemente ir al dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [location, navigate, login, isAuthenticated]); // Añadir isAuthenticated a las dependencias

  return (
    <div className="container mt-5 text-center">
      <h2>Iniciando sesión...</h2>
      <p>Por favor, espera mientras te redirigimos.</p>
    </div>
  );
};

export default AuthSuccessHandler;