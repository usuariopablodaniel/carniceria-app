import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppNavbar from './components/AppNavbar';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoute'; // <<--- ¡Mantén esta importación!

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductAddPage from './pages/ProductAddPage';
import ProductListPage from './pages/ProductListPage';
import RegisterPage from './pages/RegisterPage';
// import AuthSuccessHandler from './components/AuthSuccessHandler'; // <<< NO NECESITAS ESTE COMPONENTE YA, LO REEMPLAZAREMOS CON EL NUEVO GoogleAuthCallback

// <<<<<<<< IMPORTANTE: Importa el componente que creamos para el callback de Google
import GoogleAuthCallback from './pages/GoogleAuthCallback'; 

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppNavbar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* <<<<<<<<<<<< ESTA ES LA RUTA PARA EL CALLBACK DE GOOGLE OAUTH >>>>>>>>>>>>> */}
              {/* Es crucial que este 'path' coincida EXACTAMENTE con la URL a la que tu backend
                  redirige después de una autenticación exitosa con Google. */}
              <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
              
              {/* Ruta de Productos: Generalmente se deja pública para mostrar el catálogo.
                  Si quieres que solo los logueados vean productos, envuélvela con PrivateRoute. */}
              <Route path="/products" element={<ProductListPage />} />

              {/* RUTAS PROTEGIDAS */}
              {/* Para Dashboard: Solo accesible si el usuario está autenticado */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute> {/* <--- Envuelve DashboardPage con PrivateRoute */}
                    <DashboardPage />
                  </PrivateRoute>
                }
              />
              {/* Para añadir productos: Solo accesible si el usuario está autenticado
                  (y en el backend también verás por roles si es admin) */}
              <Route
                path="/products/add"
                element={
                  <PrivateRoute> {/* <--- Envuelve ProductAddPage con PrivateRoute */}
                    <ProductAddPage />
                  </PrivateRoute>
                }
              />
              
              {/* Puedes añadir una ruta para un 404 Not Found si lo deseas */}
              {/* <Route path="*" element={<h1>404 - Página no encontrada</h1>} /> */}
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;