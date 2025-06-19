import React, { useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext'; // Importa useAuth
import { useNavigate } from 'react-router-dom'; // Importa useNavigate

const DashboardPage = () => {
  const { user, logout } = useAuth(); // Obtén el objeto user y la función logout del contexto
  const navigate = useNavigate();

  console.log("Contenido del objeto 'user' en DashboardPage:", user);

  // Puedes usar un estado local para la información del usuario si necesitas mutarla
  // const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    // Si necesitas hacer algo cuando el componente se monta o cuando 'user' cambia
    // Por ejemplo, cargar datos adicionales del usuario si no están en el contexto
  }, [user]);

  const handleLogout = () => {
    logout(); // Llama a la función de logout del contexto
    navigate('/login'); // Redirige al usuario a la página de login
  };

  if (!user) {
    // Puedes mostrar un spinner de carga o redirigir si el usuario no está logueado
    return (
      <Container className="mt-5 text-center">
        <p>Cargando información del usuario...</p>
        <Button onClick={() => navigate('/login')}>Ir a Iniciar Sesión</Button>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={8}>
          <Card className="p-4 shadow">
            <Card.Body>
              <h1 className="text-center mb-4">¡BIENVENIDO al Dashboard, {user.nombre || 'Usuario'}!</h1>
              <p className="lead text-center">Aquí puedes gestionar tus actividades y ver tus puntos.</p>

              <hr />

              <div className="mb-4">
                <h4>Detalles de tu Cuenta:</h4>
                <p><strong>Email:</strong> {user.email}</p>
                {/* Asumiendo que tu objeto 'user' tiene una propiedad 'puntos_actuales' */}
                <p><strong>Puntos Actuales:</strong> {user.puntos_actuales !== undefined ? user.puntos_actuales : 'Cargando...'}</p>
                {/* Puedes añadir más detalles del usuario si tu objeto 'user' los tiene (ej. teléfono) */}
                {user.telefono && <p><strong>Teléfono:</strong> {user.telefono}</p>}
              </div>

              <div className="d-grid gap-2">
                <Button variant="primary" size="lg" onClick={() => alert('Funcionalidad de Canjear Puntos pendiente')}>
                  Canjear Puntos
                </Button>
                <Button variant="info" size="lg" onClick={() => alert('Funcionalidad de Escanear QR pendiente')}>
                  Escanear QR
                </Button>
                <Button variant="danger" size="lg" onClick={handleLogout}>
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