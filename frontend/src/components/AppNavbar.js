// frontend/src/components/AppNavbar.js
import React, { useState } from 'react';
import { Navbar, Nav, Button, Container, NavbarText } from 'react-bootstrap';
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

    const handleShare = async () => {
        closeMenu();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Carnicería 9 de Julio App',
                    text: '¡Descarga nuestra app y haz tus pedidos fácilmente!',
                    url: 'https://carniceria9dejulio.netlify.app'
                });
                console.log('Contenido compartido con éxito');
            } catch (error) {
                console.error('Error al compartir:', error);
            }
        } else {
            console.error('El navegador no soporta la función de compartir.');
        }
    };

    const brandNavLinkTo = isAuthenticated ? "/dashboard" : "/";

    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm" expanded={showMenu}>
            <Container>
                <Navbar.Brand as={NavLink} to={brandNavLinkTo} onClick={closeMenu}>
                    Carnicería 9 de Julio
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="basic-navbar-nav" onClick={() => setShowMenu(!showMenu)} />

                <Navbar.Collapse id="basic-navbar-nav" className="justify-content-center">
                    <Nav className="mx-auto"> {/* mx-auto centra los enlaces principales */}
                        <Nav.Link as={NavLink} to="/products" className="text-white" onClick={closeMenu}>Ofertas</Nav.Link>
                        <Nav.Link as={NavLink} to="/redemption-products" className="text-white" onClick={closeMenu}>Canje por Puntos</Nav.Link>
                        {isAdmin && (
                            <Nav.Link as={NavLink} to="/products/add" className="text-white" onClick={closeMenu}>Añadir Producto</Nav.Link>
                        )}
                        {(isAdmin || isEmployee) && (
                            <Nav.Link as={NavLink} to="/scan-qr" className="text-white" onClick={closeMenu}>Escanear QR</Nav.Link>
                        )}
                        {isAdmin && (
                            <Nav.Link as={NavLink} to="/users" className="text-white" onClick={closeMenu}>Gestión de Usuarios</Nav.Link>
                        )}
                        {isAuthenticated && (
                            <Nav.Link as={NavLink} to="/dashboard" className="text-white" onClick={closeMenu}>Dashboard</Nav.Link>
                        )}
                    </Nav>

                    <Nav className="ms-auto"> {/* ms-auto empuja estos enlaces a la derecha */}
                        <Nav.Link as={NavLink} to="/contact" className="text-white" onClick={closeMenu}>Contacto</Nav.Link>
                        {navigator.share && (
                            <Nav.Link as="button" onClick={handleShare} className="text-white">Compartir App</Nav.Link>
                        )}
                        <Nav.Link as={NavLink} to="/politica-de-privacidad.html" className="text-white" onClick={closeMenu}>Política de Privacidad</Nav.Link>
                        <Nav.Link as={NavLink} to="/terminos-de-servicio.html" className="text-white" onClick={closeMenu}>Condiciones del Servicio</Nav.Link>

                        {isAuthenticated ? (
                            <>
                                <NavbarText className="text-white me-3">
                                    Hola, {user ? user.nombre || user.name : 'Usuario'}!
                                </NavbarText>
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