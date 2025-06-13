import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <--- ¡Importa tu hook useAuth!

const AuthSuccessHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth(); // <--- ¡Obtenemos la función login del contexto!

  useEffect(() => {
    // Obtener el token de la URL (ej. ?token=XYZ)
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    console.log('Token JWT recibido:', token);

    if (token) {
      // Aquí puedes (opcionalmente) decodificar el token para obtener datos básicos del usuario
      // o hacer una llamada a tu backend para obtener el perfil completo del usuario.
      // Por ahora, vamos a simular los datos del usuario o usar un valor por defecto.

      // --- Decodificación simple del token (opcional, para obtener el email/id del token) ---
      let userData = { email: 'unknown@example.com', name: 'Usuario Google' }; // Valores por defecto
      try {
        const payloadBase64 = token.split('.')[1]; // El payload es la segunda parte del JWT
        const decodedPayload = JSON.parse(atob(payloadBase64)); // Decodificar de base64 y parsear JSON
        if (decodedPayload.email) {
          userData.email = decodedPayload.email;
        }
        if (decodedPayload.nombre) { // Si tu token incluye un campo 'nombre'
          userData.name = decodedPayload.nombre;
        } else if (decodedPayload.name) { // Si tu token incluye un campo 'name'
          userData.name = decodedPayload.name;
        }
        // Puedes añadir más campos si tu JWT los tiene (ej. id, puntos_actuales)
        // userData.id = decodedPayload.id;
        // userData.puntos_actuales = decodedPayload.puntos_actuales;

      } catch (e) {
        console.error("Error decodificando token JWT:", e);
      }

      // --- Llamar a la función login del AuthContext con el token y datos del usuario ---
      login(token, userData); // Pasa el token y los datos de usuario a tu AuthContext

      // Redirigir al dashboard después de que el login se haya procesado
      navigate('/dashboard', { replace: true });
    } else {
      // Si no hay token, redirigir al login o a una página de error
      console.error('No se recibió token JWT en la URL.');
      navigate('/login', { replace: true });
    }
  }, [location, navigate, login]); // Asegúrate de que 'login' esté en las dependencias del useEffect

  return (
    <div className="container mt-5 text-center">
      <h2>Iniciando sesión...</h2>
      <p>Por favor, espera mientras te redirigimos.</p>
    </div>
  );
};

export default AuthSuccessHandler;