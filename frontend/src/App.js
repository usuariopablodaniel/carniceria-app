// frontend/src/App.js
import React, { useState, useEffect } from 'react'; 
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
// >>>>>>>>>>>>>>> CORRECCIÓN DE RUTA AQUÍ <<<<<<<<<<<<<<<<
import ProductListPage from './pages/ProductListPage'; // Ruta corregida: quitado el 'pages/' extra
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
import RegisterPage from './pages/RegisterPage';
import GoogleAuthCallback from './pages/GoogleAuthCallback'; 
import ProductEditPage from './pages/ProductEditPage'; 
import RedemptionProductsPage from './pages/RedemptionProductsPage'; 
import ScanQRPage from './pages/ScanQRPage'; 

import UserManagementPage from './pages/UserManagementPage'; 

import GeneralNotificationBanner from './components/GeneralNotificationBanner'; 
import api from './api/axios'; // Usar la instancia 'api' de axios, no 'axios' directamente

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
                <div className="App">
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
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;