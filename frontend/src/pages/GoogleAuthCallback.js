import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userDataString = params.get('user');

    if (token && userDataString) {
      try {
        const user = JSON.parse(decodeURIComponent(userDataString));
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        login(token, user);
        // console.log('Google Login exitoso. Token y usuario guardados.'); // Eliminado
        navigate('/dashboard');
      } catch (error) {
        console.error('Error al parsear datos de usuario de Google:', error);
        navigate('/login?error=google_parse_error');
      }
    } else {
      console.error('No se encontraron token o datos de usuario en la URL de Google Callback.');
      navigate('/login?error=google_login_failed');
    }
  }, [location, navigate, login]);

  return (
    <div>
      <p>Procesando inicio de sesión con Google...</p>
    </div>
  );
};

export default GoogleAuthCallback;