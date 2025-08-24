// frontend/src/components/AppNavbar.js
import React, { useState } from 'react';
import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AppNavbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);

    const isAdmin = isAuthenticated && user && user.role === 'admin';
    const isEmployee = isAuthenticated && user && user.role === 'employee';

    const handleLogout = () => {
        logout();
        navigate('/login');
        setShowMenu(false);
    };

    const closeMenu = () => setShowMenu(false);

    const brandNavLinkTo = isAuthenticated ? "/dashboard" : "/";

    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm" expanded={showMenu}>
            <Container>
                <Navbar.Brand as={NavLink} to={brandNavLinkTo} onClick={closeMenu}>
                    Carnicería 9 de Julio
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="basic-navbar-nav" onClick={() => setShowMenu(!showMenu)} />
                
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={NavLink} to="/products" className="text-white" onClick={closeMenu}>Ofertas</Nav.Link>
                        
                        <Nav.Link as={NavLink} to="/redemption-products" className="text-white" onClick={closeMenu}>Canje por Puntos</Nav.Link>
                        
                        {/* Enlace "Añadir Producto" - Visible SOLO para ADMINISTRADORES */}
                        {isAdmin && (
                            <Nav.Link as={NavLink} to="/products/add" className="text-white" onClick={closeMenu}>Añadir Producto</Nav.Link>
                        )}
                        
                        {/* Enlace "Escanear QR" - Visible para ADMINISTRADORES o EMPLEADOS */}
                        {(isAdmin || isEmployee) && (
                            <Nav.Link as={NavLink} to="/scan-qr" className="text-white" onClick={closeMenu}>Escanear QR</Nav.Link>
                        )}
                        
                        {/* Enlace de Gestión de Usuarios (SOLO ADMIN) */}
                        {isAdmin && (
                            <Nav.Link as={NavLink} to="/users" className="text-white" onClick={closeMenu}>Gestión de Usuarios</Nav.Link>
                        )}

                        {/* Enlace al Dashboard, visible para cualquier usuario autenticado */}
                        {isAuthenticated && (
                            <Nav.Link as={NavLink} to="/dashboard" className="text-white" onClick={closeMenu}>Dashboard</Nav.Link>
                        )}
                    </Nav>
                    <Nav>
                        {/* Enlaces de información y política de privacidad */}
                        <Nav.Link as={NavLink} to="/contact" className="text-white" onClick={closeMenu}>Contacto</Nav.Link>
                        <Nav.Link as={NavLink} to="/politica-de-privacidad.html" className="text-white" onClick={closeMenu}>Política de Privacidad</Nav.Link>
                        <Nav.Link as={NavLink} to="/terminos-de-servicio.html" className="text-white" onClick={closeMenu}>Condiciones del Servicio</Nav.Link>
                        {/* Botones de autenticación */}
                        {isAuthenticated ? (
                            <>
                                <Navbar.Text className="text-white me-3">
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
                                    onClick={() => { navigate('/login'); closeMenu(); }}
                                >
                                    Iniciar Sesión
                                </Button>
                                <Button 
                                    variant="light" 
                                    onClick={() => { navigate('/register'); closeMenu(); }}
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