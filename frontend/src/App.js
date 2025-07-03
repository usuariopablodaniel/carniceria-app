import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppNavbar from './components/AppNavbar';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoute'; 

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductAddPage from './pages/ProductAddPage';
import ProductListPage from './pages/ProductListPage';
import RegisterPage from './pages/RegisterPage';
import GoogleAuthCallback from './pages/GoogleAuthCallback'; 

import ProductEditPage from './pages/ProductEditPage'; 
// >>>>>>>>>>>>>>> NUEVA IMPORTACIÓN PARA LA PÁGINA DE CANJE <<<<<<<<<<<<<<<<
import RedemptionProductsPage from './pages/RedemptionProductsPage'; 

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
              
              <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
              
              {/* Esta ruta ahora muestra solo productos de venta/ofertas */}
              <Route path="/products" element={<ProductListPage />} />

              {/* >>>>>>>>>>>>>>> NUEVA RUTA PARA PRODUCTOS DE CANJE <<<<<<<<<<<<<<<< */}
              <Route path="/redemption-products" element={<RedemptionProductsPage />} />

              {/* RUTAS PROTEGIDAS */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <DashboardPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/products/add"
                element={
                  <PrivateRoute>
                    <ProductAddPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/products/edit/:id" 
                element={
                  <PrivateRoute>
                    <ProductEditPage />
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