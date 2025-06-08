import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate, Link } from 'react-router-dom';


const AppNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log('Cerrando sesión...');
    navigate('/login');
    window.location.reload();
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        {/* Este es el único LinkContainer que dejamos por ahora */}
        <LinkContainer to="/">
          <Navbar.Brand>Carnicería App</Navbar.Brand>
        </LinkContainer>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {/* Eliminamos temporalmente todas las demás Navs y Links */}
          <Nav className="me-auto"></Nav>
          <Nav>
             {/* Eliminamos temporalmente la lógica de botones */}
             {/* Puedes descomentar esto después de que el Navbar se muestre */}
             {/* <Button variant="outline-light" onClick={handleLogout}>Cerrar Sesión</Button> */}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;