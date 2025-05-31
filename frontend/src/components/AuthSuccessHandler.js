import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthSuccessHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      console.log("Token JWT recibido:", token);
      localStorage.setItem('jwtToken', token);
      navigate('/dashboard'); // Redirige al dashboard después de guardar el token
      alert('¡Inicio de sesión con Google exitoso!');
    } else {
      console.error("No se encontró ningún token en la URL.");
      navigate('/login');
      alert('Error al iniciar sesión con Google. No se recibió el token.');
    }
  }, [location, navigate]);

  return (
    <div>
      <p>Procesando inicio de sesión con Google...</p>
    </div>
  );
};

export default AuthSuccessHandler;