// frontend/src/components/AppNavbar.js
import React from 'react';
import { Navbar, Nav, Button, Container } from 'react-bootstrap'; 
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AppNavbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    // Aquí podemos verificar si el usuario es administrador de manera sencilla
    const isAdmin = isAuthenticated && user && user.role === 'admin';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
            <Container>
                <Navbar.Brand as={NavLink} to="/">Carnicería App</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {/* Enlaces siempre visibles o condicionales para todos los usuarios */}
                        {/* 'Ofertas' será la página principal de productos en venta */}
                        <Nav.Link as={NavLink} to="/products" className="text-white">Ofertas</Nav.Link>
                        
                        {/* 'Canje por Puntos' visible para todos los usuarios */}
                        <Nav.Link as={NavLink} to="/redemption-products" className="text-white">Canje por Puntos</Nav.Link>

                        {/* Enlaces visibles solo para ADMINISTRADORES o EMPLEADOS */}
                        {isAuthenticated && user && (user.role === 'admin' || user.role === 'employee') && (
                            <>
                                <Nav.Link as={NavLink} to="/products/add" className="text-white">Añadir Producto</Nav.Link>
                                <Nav.Link as={NavLink} to="/scan-qr" className="text-white">Escanear QR</Nav.Link> 
                            </>
                        )}
                        
                        {/* >>>>>>>>>>>>> Enlace de Gestión de Usuarios (SOLO ADMIN) <<<<<<<<<<<<< */}
                        {isAdmin && (
                            <Nav.Link as={NavLink} to="/users" className="text-white">Gestión de Usuarios</Nav.Link>
                        )}

                        {/* Enlace al Dashboard, visible para cualquier usuario autenticado */}
                        {isAuthenticated && (
                            <Nav.Link as={NavLink} to="/dashboard" className="text-white">Dashboard</Nav.Link>
                        )}
                    </Nav>
                    <Nav>
                        {/* Botones de autenticación */}
                        {isAuthenticated ? (
                            <>
                                <Navbar.Text className="text-white me-3">
                                    {/* Mostrar el nombre del usuario si existe, si no, 'Usuario' */}
                                    Hola, {user ? user.nombre || user.name : 'Usuario'}! 
                                </Navbar.Text>
                                <Button variant="outline-light" onClick={handleLogout}>
                                    Cerrar Sesión
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button 
                                    variant="outline-light" 
                                    className="me-2" 
                                    onClick={() => navigate('/login')}
                                >
                                    Iniciar Sesión
                                </Button>
                                <Button 
                                    variant="light" 
                                    onClick={() => navigate('/register')}
                                >
                                    Registrarse
                                </Button>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default AppNavbar;
