// frontend/src/App.js
import React, { useState, useEffect } from 'react'; // Añadido useState y useEffect
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
import RedemptionProductsPage from './pages/RedemptionProductsPage'; 
import ScanQRPage from './pages/ScanQRPage'; 

// >>>>>>>>>>>>>>> NUEVA IMPORTACIÓN PARA GESTIÓN DE USUARIOS <<<<<<<<<<<<<<<<
import UserManagementPage from './pages/UserManagementPage'; 

// >>>>>>>>>>>>>>> NUEVAS IMPORTACIONES PARA NOTIFICACIONES <<<<<<<<<<<<<<<<
import GeneralNotificationBanner from './components/GeneralNotificationBanner'; 
import axios from './api/axios'; // Asegúrate de que este axios sea tu instancia configurada para el backend

function App() {
    // Estado para almacenar el mensaje de la notificación general
    const [generalNotificationMessage, setGeneralNotificationMessage] = useState(null);

    // useEffect para cargar la notificación general del backend
    useEffect(() => {
        const fetchGeneralNotification = async () => {
            try {
                // Realizar la llamada al backend para obtener la notificación general
                // Asegúrate de que la URL '/notifications/general' sea la correcta para tu backend
                const response = await axios.get('/notifications/general'); 
                
                if (response.data && response.data.isActive && response.data.message) {
                    setGeneralNotificationMessage(response.data.message);
                } else {
                    setGeneralNotificationMessage(null); // No hay notificación activa o mensaje vacío
                }
            } catch (error) {
                console.error("Error al obtener la notificación general:", error);
                setGeneralNotificationMessage(null); // Asegurar que no se muestre si hay un error
            }
        };

        fetchGeneralNotification();

        // Opcional: Puedes configurar un intervalo para refrescar la notificación cada cierto tiempo
        // Esto es útil si esperas que el mensaje de la notificación cambie mientras la app está abierta.
        // const intervalId = setInterval(fetchGeneralNotification, 60000); // Cada 1 minuto
        // return () => clearInterval(intervalId); // Limpiar el intervalo al desmontar el componente

    }, []); // El array de dependencias vacío asegura que se ejecute solo una vez al montar App

    return (
        <Router>
            <AuthProvider>
                <div className="App">
                    {/* Renderizar el banner de notificación si hay un mensaje */}
                    {generalNotificationMessage && (
                        <GeneralNotificationBanner message={generalNotificationMessage} />
                    )}
                    <AppNavbar />
                    <main>
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            
                            <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
                            
                            <Route path="/products" element={<ProductListPage />} />
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
                            {/* Ruta para escanear QR */}
                            <Route
                                path="/scan-qr" 
                                element={
                                    <PrivateRoute>
                                        <ScanQRPage />
                                    </PrivateRoute>
                                }
                            />

                            {/* >>>>>>>>>>>>>>> NUEVA RUTA PROTEGIDA PARA GESTIÓN DE USUARIOS <<<<<<<<<<<<<<<< */}
                            <Route
                                path="/users"
                                element={
                                    <PrivateRoute>
                                        <UserManagementPage />
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