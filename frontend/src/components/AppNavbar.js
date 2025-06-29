import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { Link } from 'react-router-dom'; // Mantener Link para botones fuera de LinkContainer
import { useAuth } from '../context/AuthContext'; // <<<<<<< IMPORTANTE: Importa useAuth


const AppNavbar = () => {
  // <<<<<<<<< CAMBIO CLAVE AQUÍ: Obtén los valores del AuthContext >>>>>>>>>>
  const { isAuthenticated, logout, user } = useAuth(); 
  // No necesitamos useNavigate directamente en AppNavbar para el logout,
  // ya que la función logout del contexto ya maneja la navegación.

  // La función handleLogout ya no es necesaria aquí si solo se encarga de llamar a logout del contexto
  // Sin embargo, si quieres mantenerla para logs o lógica adicional:
  const handleNavbarLogout = () => {
    console.log('Cerrando sesión desde Navbar...');
    logout(); // Llama a la función logout del AuthContext
    // No necesitas navigate('/login') o window.location.reload() aquí,
    // ya que 'logout()' del contexto ya maneja la redirección y la limpieza.
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand>Carnicería App</Navbar.Brand>
        </LinkContainer>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* Estos enlaces se mostrarán si el usuario está autenticado */}
            {isAuthenticated && (
              <>
                <LinkContainer to="/products">
                  <Nav.Link>Productos</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/dashboard">
                  <Nav.Link>Mi Perfil</Nav.Link>
                </LinkContainer>
                {/* Opcional: Enlace para añadir productos solo si es admin */}
                {isAuthenticated && user && user.role === 'admin' && (
                  <LinkContainer to="/products/add">
                    <Nav.Link>Añadir Producto</Nav.Link>
                  </LinkContainer>
                )}
              </>
            )}
          </Nav>
          <Nav>
            {/* Lógica para mostrar Iniciar Sesión/Registrarse o Cerrar Sesión */}
            {!isAuthenticated ? (
              <>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Button variant="outline-light" className="me-2">Iniciar Sesión</Button>
                </Link>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Button variant="light">Registrarse</Button>
                </Link>
              </>
            ) : (
              // Si el usuario está autenticado, muestra el nombre y el botón de cerrar sesión
              <>
                {user && <Nav.Link className="text-light me-2">Hola, {user.nombre}!</Nav.Link>} {/* Muestra el nombre del usuario */}
                <Button variant="outline-light" onClick={handleNavbarLogout}> {/* Llama a la nueva función de logout */}
                  Cerrar Sesión
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