import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook para acceder a la URL actual
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userDataString = params.get('user'); // El backend debería enviar el usuario como string JSON

    if (token && userDataString) {
      try {
        const user = JSON.parse(decodeURIComponent(userDataString)); // Decodificar y parsear el JSON
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        login(token, user); // Actualiza el AuthContext
        console.log('Google Login exitoso. Token y usuario guardados.');
        navigate('/dashboard'); // Redirige al dashboard o página principal
      } catch (error) {
        console.error('Error al parsear datos de usuario de Google:', error);
        // Manejar el error, quizás redirigir a login con un mensaje de error
        navigate('/login?error=google_parse_error');
      }
    } else {
      console.error('No se encontraron token o datos de usuario en la URL de Google Callback.');
      navigate('/login?error=google_login_failed'); // Redirige a login si faltan datos
    }
  }, [location, navigate, login]); // Dependencias del useEffect

  return (
    <div>
      <p>Procesando inicio de sesión con Google...</p>
      {/* Puedes añadir un spinner o mensaje de carga */}
    </div>
  );
};

export default GoogleAuthCallback;