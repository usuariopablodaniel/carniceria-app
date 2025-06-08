import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// 1. Crea el contexto
export const AuthContext = createContext(null);

// 2. Crea el proveedor del contexto
export const AuthProvider = ({ children }) => {
  // Estados para la autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Inicializa el estado de autenticación verificando si hay un token en localStorage
    return localStorage.getItem('token') ? true : false;
  });
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null); // Almacena los datos del usuario (email, nombre, etc.)

  // Hook para la navegación programática
  const navigate = useNavigate();

  // Función para simular el login
  const login = (jwtToken, userData = null) => {
    console.log('--- Función login del AuthContext iniciada ---');
    localStorage.setItem('token', jwtToken); // Guarda el token en localStorage
    setToken(jwtToken); // Actualiza el estado del token
    setIsAuthenticated(true); // Establece isAuthenticated a true
    if (userData) {
      setUser(userData); // Guarda los datos del usuario si se proporcionan
    }

    console.log('✅ Todos los estados de login actualizados. Preparando redirección...');
    try {
      navigate('/dashboard'); // Redirige al dashboard después del login
      console.log('✅ Redirección a /dashboard ejecutada con éxito.');
    } catch (error) {
      console.error('❌ Error al intentar redirigir con navigate:', error);
    }

    console.log('--- Función login del AuthContext finalizada ---');
  };

  // Función para simular el logout
  const logout = () => {
    console.log('--- Función logout del AuthContext iniciada ---');
    localStorage.removeItem('token'); // Elimina el token de localStorage
    setToken(null); // Limpia el estado del token
    setIsAuthenticated(false); // Establece isAuthenticated a false
    setUser(null); // Limpia los datos del usuario
    navigate('/login'); // Redirige a la página de login
    console.log('--- Función logout del AuthContext finalizada ---');
  };

  // Efecto para simular la carga de datos del usuario si ya hay un token
  useEffect(() => {
    if (token && !user) {
      // Esta parte simula la obtención de datos del usuario si hay un token.
      // En un entorno real, aquí harías una llamada a tu backend para obtener los datos
      // del usuario usando el token, y luego los establecerías con setUser().
      setUser({ email: 'usuario@ejemplo.com', name: 'Usuario Demo' });
    }
  }, [token, user]); // Se ejecuta cuando token o user cambian

  // El valor que se proveerá a los componentes que consuman este contexto
  const authContextValue = {
    isAuthenticated,
    token,
    user,
    login,
    logout,
  };

  // Retorna el proveedor del contexto, envolviendo a los componentes hijos
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para consumir el contexto de autenticación de manera fácil
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Si useAuth se usa fuera de un AuthProvider, lanza un error
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};