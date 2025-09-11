// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppNavbar from './components/AppNavbar';
import Footer from './components/Footer'; // Nuevo import para el Footer

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
// ¡CORRECCIÓN! Se cambia el nombre del componente importado a RedemptionProductsPage
import RedemptionProductsPage from './pages/RedemptionProductsPage';
import ScanQRPage from './pages/ScanQRPage';
import UserManagementPage from './pages/UserManagementPage';
import GeneralNotificationBanner from './components/GeneralNotificationBanner';
import api from './api/axios';
import ContactPage from './pages/ContactPage';

// Importaciones de los nuevos componentes de restablecimiento de contraseña
import PasswordResetRequestPage from './pages/PasswordResetRequestPage';
import ResetPasswordPage from './pages/ResetPasswordPage'; 

function App() {
    const [generalNotificationMessage, setGeneralNotificationMessage] = useState(null);

    useEffect(() => {
        const fetchGeneralNotification = async () => {
            try {
                const response = await api.get('/notifications/general');
                
                if (response.data && response.data.isActive && response.data.message) {
                    setGeneralNotificationMessage(response.data.message);
                } else {
                    setGeneralNotificationMessage(null);
                }
            } catch (error) {
                console.error("Error al obtener la notificación general:", error);
                setGeneralNotificationMessage(null);
            }
        };
        fetchGeneralNotification();
    }, []);

    return (
        <Router>
            <AuthProvider>
                <div className="d-flex flex-column min-vh-100"> {/* Añadido flexbox para que el footer se pegue al fondo */}
                    {generalNotificationMessage && (
                        <GeneralNotificationBanner message={generalNotificationMessage} />
                    )}
                    <AppNavbar />
                    <main className="flex-grow-1"> {/* Añadido flex-grow-1 para que el contenido crezca */}
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            
                            <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
                            
                            <Route path="/products" element={<ProductListPage />} />
                            {/* ¡CORRECCIÓN! Ahora renderiza el componente con el nombre correcto */}
                            <Route path="/redemption-products" element={<RedemptionProductsPage />} />
                            <Route path="/contact" element={<ContactPage />} />

                            {/* Ruta para solicitar el restablecimiento de contraseña */}
                            <Route path="/password-reset-request" element={<PasswordResetRequestPage />} />

                            {/* ¡¡CAMBIO CLAVE AQUÍ!! La ruta NO debe tener ':token'. */}
                            <Route path="/reset-password" element={<ResetPasswordPage />} />

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
                            <Route
                                path="/scan-qr"
                                element={
                                    <PrivateRoute>
                                        <ScanQRPage />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/users"
                                element={
                                    <PrivateRoute>
                                        <UserManagementPage />
                                    </PrivateRoute>
                                }
                            />
                        </Routes>
                    </main>
                    <Footer /> {/* Añadido el componente Footer al final */}
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;