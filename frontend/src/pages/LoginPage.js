import React from 'react';

const LoginPage = () => {
  // Función para redirigir a la autenticación de Google
  const handleGoogleLogin = () => {
    // Redirige al usuario a la ruta de tu backend que inicia el flujo de Google
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div>
      <h1>Iniciar Sesión</h1>
      {/* Puedes añadir un formulario de inicio de sesión tradicional aquí si lo deseas */}

      <h2>O inicia sesión con Google</h2>
      <button onClick={handleGoogleLogin}>
        Iniciar sesión con Google
      </button>
    </div>
  );
};

export default LoginPage;