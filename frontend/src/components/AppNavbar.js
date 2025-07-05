import React from 'react';
import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importa el contexto de autenticación

const AppNavbar = () => {
    const { isAuthenticated, user, logout } = useAuth(); // Obtener estado de autenticación y función logout
    const navigate = useNavigate();

    const handleLogout = () => {
        logout(); // Llama a la función de logout del contexto
        navigate('/login'); // Redirige al usuario a la página de login después de cerrar sesión
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
                        
                        {/* 'Canje por Puntos' para todos los usuarios, pero el botón de canjear solo para 'user' */}
                        <Nav.Link as={NavLink} to="/redemption-products" className="text-white">Canje por Puntos</Nav.Link>

                        {/* Enlaces visibles solo para ADMINISTRADORES */}
                        {isAuthenticated && user && user.role === 'admin' && (
                            <>
                                <Nav.Link as={NavLink} to="/products/add" className="text-white">Añadir Producto</Nav.Link>
                                {/* Podrías añadir un enlace a una página de gestión de usuarios si la creas */}
                                {/* <Nav.Link as={NavLink} to="/admin/users" className="text-white">Gestionar Usuarios</Nav.Link> */}
                            </>
                        )}

                        {/* Enlace al Dashboard, visible para cualquier usuario autenticado */}
                        {isAuthenticated && (
                            <Nav.Link as={NavLink} to="/dashboard" className="text-white">Dashboard</Nav.Link>
                        )}
                    </Nav>
                    <Nav>
                        {/* Botones de autenticación */}
                        {isAuthenticated ? (
                            // Si está autenticado, muestra el nombre del usuario y el botón de cerrar sesión
                            <>
                                <Navbar.Text className="text-white me-3">
                                    Hola, {user ? user.name : 'Usuario'}!
                                </Navbar.Text>
                                <Button variant="outline-light" onClick={handleLogout}>
                                    Cerrar Sesión
                                </Button>
                            </>
                        ) : (
                            // Si no está autenticado, muestra los botones de Iniciar Sesión y Registrarse
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
