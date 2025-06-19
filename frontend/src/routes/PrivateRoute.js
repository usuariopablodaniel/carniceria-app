// frontend/src/routes/PrivateRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, token, loadingAuth } = useAuth(); // <-- Obtener loadingAuth

  console.log('--- PrivateRoute check ---');
  console.log('isAuthenticated en PrivateRoute:', isAuthenticated);
  console.log('Token en PrivateRoute:', token ? 'Existe' : 'No existe');
  console.log('loadingAuth en PrivateRoute:', loadingAuth); // <-- Nuevo log

  // Si aún estamos cargando el estado de autenticación, mostrar un spinner o null
  if (loadingAuth) {
    console.log('PrivateRoute: Aún cargando el estado de autenticación. Esperando...');
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Cargando autenticación...
      </div>
    ); // O un componente de spinner
  }

  // Si no está autenticado después de la carga, redirige a la página de login
  if (!isAuthenticated) {
    console.log('PrivateRoute: Usuario NO autenticado (carga finalizada). Redirigiendo a /login.');
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderiza los componentes hijos (la página protegida)
  console.log('PrivateRoute: Usuario AUTENTICADO (carga finalizada). Permitiendo acceso.');
  return children;
};

export default PrivateRoute;