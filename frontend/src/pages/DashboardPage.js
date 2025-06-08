import React from 'react';
import { useAuth } from '../context/AuthContext'; // Importamos el hook useAuth
import { Button, Container, Row, Col, Card } from 'react-bootstrap'; // Componentes de Bootstrap

const DashboardPage = () => {
  // Obtenemos los datos del usuario y la función de logout directamente del AuthContext
  const { user, logout, isAuthenticated } = useAuth(); // Añadimos isAuthenticated para una doble verificación

  // Esta condición es una doble capa de seguridad, aunque PrivateRoute ya debería manejar esto
  if (!isAuthenticated || !user) {
    // En una app real, aquí podrías redirigir o mostrar un mensaje de error si el AuthContext no tiene el usuario
    // Pero PrivateRoute ya debería haber redirigido si no estaba autenticado.
    // Si el usuario no está, simplemente no se muestra el contenido o se muestra un cargando.
    // Podríamos redirigir aquí también, pero PrivateRoute ya lo hace.
    return (
      <Container className="mt-5">
        <Row className="justify-content-md-center">
          <Col md={6}>
            <p>Cargando perfil del usuario o usuario no disponible...</p>
            <p>Si esto persiste, por favor, intenta iniciar sesión de nuevo.</p>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={8}>
          <Card>
            <Card.Header as="h1" className="text-center">¡Bienvenido al Dashboard, {user.name}!</Card.Header>
            <Card.Body>
              <Card.Text>
                Este es tu espacio personal. Aquí podrás ver y gestionar tu información.
              </Card.Text>
              <ul className="list-unstyled">
                <li><strong>Email:</strong> {user.email}</li>
                {/* Si tu simulación de usuario no tiene puntos, puedes omitir esta línea */}
                <li><strong>Puntos actuales:</strong> {user.puntos_actuales || 'No disponible'}</li>
                {/* Puedes añadir más datos del usuario aquí si los tiene tu objeto 'simulatedUserData' */}
              </ul>
              <div className="d-grid gap-2">
                <Button variant="danger" onClick={logout} className="mt-3">
                  Cerrar Sesión
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardPage;