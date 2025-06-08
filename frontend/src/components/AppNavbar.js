import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate, Link } from 'react-router-dom';


const AppNavbar = () => {
  // *** Asegúrate de tener esta línea ***
  const isAuthenticated = true; // Temporalmente en true para desarrollo

  const navigate = useNavigate();

  const handleLogout = () => {
    console.log('Cerrando sesión...');
    navigate('/login');
    window.location.reload();
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
            {/* Aquí es donde necesitamos isAuthenticated */}
            {isAuthenticated && (
              <>
                {/* Ahora podemos reintroducir estos enlaces */}
                <LinkContainer to="/products">
                  <Nav.Link>Productos</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/dashboard">
                  <Nav.Link>Mi Perfil</Nav.Link>
                </LinkContainer>
              </>
            )}
          </Nav>
          <Nav>
            {/* Y aquí reintroduciremos la lógica de los botones usando Link */}
            {isAuthenticated ? (
              <Button variant="outline-light" onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            ) : (
              <>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Button variant="outline-light" className="me-2">Iniciar Sesión</Button>
                </Link>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Button variant="light">Registrarse</Button>
                </Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;