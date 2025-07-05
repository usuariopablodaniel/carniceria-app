// frontend/src/pages/DashboardPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Card, Alert, Button, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
// >>>>>>>>>>>>>>> CORRECCIÓN AQUÍ: Importar QRCodeSVG <<<<<<<<<<<<<<<<
import { QRCodeSVG } from 'qrcode.react'; 
import axios from '../api/axios'; // Para obtener los puntos del usuario

const DashboardPage = () => {
    const { user, isAuthenticated, loadingAuth } = useAuth();
    const [userPoints, setUserPoints] = useState(null);
    const [loadingPoints, setLoadingPoints] = useState(true);
    const [errorPoints, setErrorPoints] = useState(null);

    // Función para obtener los puntos del usuario
    const fetchUserPoints = useCallback(async () => {
        if (!user || !user.id) {
            setLoadingPoints(false);
            return;
        }
        setLoadingPoints(true);
        setErrorPoints(null);
        try {
            const response = await axios.get(`/transactions/${user.id}/points`);
            setUserPoints(response.data.points);
        } catch (err) {
            console.error('Error al obtener los puntos del usuario:', err);
            setErrorPoints('No se pudieron cargar tus puntos. Intenta de nuevo más tarde.');
            setUserPoints(null);
        } finally {
            setLoadingPoints(false);
        }
    }, [user]);

    useEffect(() => {
        if (!loadingAuth && isAuthenticated && user) {
            fetchUserPoints();
        }
    }, [loadingAuth, isAuthenticated, user, fetchUserPoints]);

    if (loadingAuth) {
        return (
            <Container className="my-5 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando dashboard...</span>
                </Spinner>
                <p className="mt-3">Cargando tu dashboard...</p>
            </Container>
        );
    }

    if (!isAuthenticated) {
        return (
            <Container className="my-5 text-center">
                <Alert variant="danger">No estás autenticado. Redirigiendo al login...</Alert>
            </Container>
        );
    }

    return (
        <Container className="my-5">
            <h1 className="text-center mb-4">Bienvenido al Dashboard, {user?.name || 'Usuario'}!</h1>
            <p className="text-center text-muted mb-5">Aquí puedes gestionar tu perfil y ver tus beneficios.</p>

            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="shadow-sm rounded-lg">
                        <Card.Body className="p-4">
                            <Card.Title className="text-primary mb-3">Tu Perfil</Card.Title>
                            <Card.Text>
                                <strong>Email:</strong> {user?.email}
                            </Card.Text>
                            <Card.Text>
                                <strong>Rol:</strong> {user?.role === 'admin' ? 'Administrador' : 'Cliente'}
                            </Card.Text>
                            <hr />
                            <Card.Title className="text-success mb-3">Tus Puntos</Card.Title>
                            {loadingPoints ? (
                                <div className="d-flex align-items-center">
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    <span>Cargando puntos...</span>
                                </div>
                            ) : errorPoints ? (
                                <Alert variant="danger" className="py-2">{errorPoints}</Alert>
                            ) : (
                                <h3 className="mb-3">Puntos Actuales: <span className="text-success fw-bold">{userPoints !== null ? userPoints : 'N/A'}</span></h3>
                            )}
                            <Button variant="outline-primary" onClick={fetchUserPoints} disabled={loadingPoints}>
                                {loadingPoints ? 'Actualizando...' : 'Actualizar Puntos'}
                            </Button>
                            <hr />
                            <Card.Title className="text-info mb-3">Tu Código QR</Card.Title>
                            <p className="text-muted">Muestra este código al personal para sumar o canjear puntos.</p>
                            <div className="d-flex justify-content-center mb-3">
                                {/* >>>>>>>>>>>>>>> CORRECCIÓN AQUÍ: Usar QRCodeSVG <<<<<<<<<<<<<<<< */}
                                {user?.id ? (
                                    <QRCodeSVG value={user.id.toString()} size={256} level="H" includeMargin={true} />
                                ) : (
                                    <Alert variant="warning" className="py-2">ID de usuario no disponible para generar QR.</Alert>
                                )}
                            </div>
                            <Card.Text className="text-center small text-muted">
                                ID de Usuario: {user?.id || 'No disponible'}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default DashboardPage;