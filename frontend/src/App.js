import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppNavbar from './components/AppNavbar';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoute'; // <--- ¡Nueva importación! Ajusta la ruta si lo pusiste en otro lado.

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductAddPage from './pages/ProductAddPage';
import ProductListPage from './pages/ProductListPage'; // ProductListPage a veces se deja pública para mostrar el catálogo
import RegisterPage from './pages/RegisterPage';
import AuthSuccessHandler from './components/AuthSuccessHandler';


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
              <Route path="/auth-success" element={<AuthSuccessHandler />} />

              {/* Ruta de Productos: Podemos dejarla pública o protegerla.
                 Por ahora, la dejaré pública para que los usuarios puedan ver el catálogo.
                 Si quieres que solo los logueados vean productos, envuélvela también.
              */}
              <Route path="/products" element={<ProductListPage />} />

              {/* RUTAS PROTEGIDAS */}
              {/* Para Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute> {/* <--- ¡Aquí lo envolvemos! */}
                    <DashboardPage />
                  </PrivateRoute>
                }
              />
              {/* Para añadir productos (generalmente solo admin/autenticados) */}
              <Route
                path="/products/add"
                element={
                  <PrivateRoute> {/* <--- ¡Aquí lo envolvemos! */}
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