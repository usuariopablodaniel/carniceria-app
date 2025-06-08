import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  // Asegúrate de desestructurar 'token' aquí
  const { isAuthenticated, token } = useAuth();

  console.log('--- PrivateRoute check ---');
  console.log('isAuthenticated en PrivateRoute:', isAuthenticated);
  console.log('Token en PrivateRoute:', token ? 'Existe' : 'No existe');

  // Si no está autenticado, redirige a la página de login
  if (!isAuthenticated) {
    console.log('PrivateRoute: Usuario NO autenticado. Redirigiendo a /login.');
    // Usamos 'replace' para que el usuario no pueda volver a la página protegida con el botón 'Atrás'
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderiza los componentes hijos (la página protegida)
  console.log('PrivateRoute: Usuario AUTENTICADO. Permitiendo acceso.');
  return children;
};

export default PrivateRoute;
