// frontend/src/routes/PrivateRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  // Eliminado 'token' de la desestructuración ya que no se usa directamente aquí.
  const { isAuthenticated, loadingAuth } = useAuth(); 

  // Si aún estamos cargando el estado de autenticación, mostrar un spinner o null
  if (loadingAuth) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Cargando autenticación...
      </div>
    ); // O un componente de spinner
  }

  // Si no está autenticado después de la carga, redirige a la página de login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderiza los componentes hijos (la página protegida)
  return children;
};

export default PrivateRoute;