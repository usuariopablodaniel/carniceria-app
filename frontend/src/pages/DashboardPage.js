// frontend/src/pages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Spinner, Alert, ListGroup } from 'react-bootstrap'; // Importar ListGroup
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { useLocation } from 'react-router-dom';

const DashboardPage = () => {
    const { user, isAuthenticated, loadingAuth } = useAuth();
    const [userPoints, setUserPoints] = useState(null);
    const [loadingPoints, setLoadingPoints] = useState(true);
    const [pointsError, setPointsError] = useState(null);
    const location = useLocation();

    // >>>>>>>>>>>>>>> NUEVOS ESTADOS PARA EL HISTORIAL DE TRANSACCIONES <<<<<<<<<<<<<<<<
    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [transactionsError, setTransactionsError] = useState(null);

    // Estado para el mensaje de redirección
    const [redirectMessage, setRedirectMessage] = useState(null);
    const [messageVariant, setMessageVariant] = useState('info');

    // Efecto para manejar mensajes de redirección
    useEffect(() => {
        if (location.state && location.state.message) {
            setRedirectMessage(location.state.message);
            setMessageVariant(location.state.variant || 'info');
            window.history.replaceState({}, document.title); 
        }
    }, [location.state]);

    // Efecto para obtener los puntos del usuario
    useEffect(() => {
        const fetchUserPoints = async () => {
            if (!isAuthenticated || !user || !user.id) {
                setLoadingPoints(false);
                return;
            }
            try {
                setLoadingPoints(true);
                setPointsError(null);
                const response = await axios.get(`/transactions/${user.id}/points`);
                setUserPoints(response.data.points);
            } catch (err) {
                console.error('Error al obtener los puntos del usuario:', err);
                setPointsError('No se pudieron cargar tus puntos.');
            } finally {
                setLoadingPoints(false);
            }
        };

        if (!loadingAuth) {
            fetchUserPoints();
        }
    }, [isAuthenticated, user, loadingAuth]);

    // >>>>>>>>>>>>>>> NUEVO EFECTO PARA OBTENER EL HISTORIAL DE TRANSACCIONES <<<<<<<<<<<<<<<<
    useEffect(() => {
        const fetchTransactionsHistory = async () => {
            if (!isAuthenticated || !user || !user.id) {
                setLoadingTransactions(false);
                return;
            }
            try {
                setLoadingTransactions(true);
                setTransactionsError(null);
                // Llamada a la nueva ruta del backend
                const response = await axios.get(`/transactions/history/${user.id}`);
                setTransactions(response.data);
                console.log("Historial de transacciones cargado:", response.data); // Para depuración
            } catch (err) {
                console.error('Error al obtener el historial de transacciones:', err);
                setTransactionsError('No se pudo cargar tu historial de transacciones.');
            } finally {
                setLoadingTransactions(false);
            }
        };

        if (!loadingAuth) { // Asegurarse de que la autenticación haya terminado
            fetchTransactionsHistory();
        }
    }, [isAuthenticated, user, loadingAuth]); // Depende del usuario y su estado de autenticación

    // Función auxiliar para formatear la fecha
    const formatDateTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleString('es-AR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    if (loadingAuth) {
        return (
            <Container className="my-5 text-center">
                <Spinner animation="border" className="mt-3" />
                <p>Cargando información del usuario...</p>
            </Container>
        );
    }

    if (!isAuthenticated) {
        return (
            <Container className="my-5 text-center">
                <h2 className="mb-3">Acceso Denegado</h2>
                <p className="text-muted">Por favor, inicia sesión para ver tu dashboard.</p>
            </Container>
        );
    }

    return (
        <Container className="my-5 p-4 border rounded shadow-sm" style={{ maxWidth: '800px' }}>
            <h1 className="mb-4 text-center text-primary">
                Bienvenido, {user && user.nombre ? user.nombre : 'Usuario'}!
            </h1>
            <p className="text-center text-muted mb-4">Tu centro de control de puntos y perfil.</p>

            {redirectMessage && (
                <Alert variant={messageVariant} onClose={() => setRedirectMessage(null)} dismissible className="mb-4">
                    {redirectMessage}
                </Alert>
            )}

            <Row className="g-4">
                <Col md={6}>
                    <Card className="h-100 shadow-sm rounded-lg">
                        <Card.Body className="text-center">
                            <Card.Title className="mb-3">Tus Puntos Actuales</Card.Title>
                            {loadingPoints ? (
                                <Spinner animation="border" />
                            ) : pointsError ? (
                                <Alert variant="danger" className="mt-3">{pointsError}</Alert>
                            ) : (
                                <h2 className="display-4 text-success">{userPoints !== null ? userPoints : 'N/A'}</h2>
                            )}
                            <Card.Text className="text-muted mt-3">
                                ¡Sigue acumulando puntos con cada compra!
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="h-100 shadow-sm rounded-lg">
                        <Card.Body className="text-center">
                            <Card.Title className="mb-3">Tu Código QR</Card.Title>
                            {user && user.id ? (
                                <>
                                    <div className="d-flex justify-content-center mb-3">
                                        <QRCodeCanvas 
                                            value={user.id.toString()} 
                                            size={180} 
                                            level="H" 
                                            includeMargin={true} 
                                        />
                                    </div>
                                    <Card.Text className="text-muted">
                                        Muestra este QR al vendedor para registrar tus compras y canjes.
                                    </Card.Text>
                                    <p className="fw-bold mt-2">ID de Usuario: {user.id}</p>
                                </>
                            ) : (
                                <p className="text-muted">Cargando QR...</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* >>>>>>>>>>>>>>> SECCIÓN DE HISTORIAL DE TRANSACCIONES <<<<<<<<<<<<<<<< */}
            <Row className="mt-4">
                <Col>
                    <Card className="shadow-sm rounded-lg">
                        <Card.Body>
                            <Card.Title className="text-center mb-3">Historial de Transacciones</Card.Title>
                            {loadingTransactions ? (
                                <div className="text-center py-3">
                                    <Spinner animation="border" size="sm" />
                                    <p className="mt-2 text-muted">Cargando historial...</p>
                                </div>
                            ) : transactionsError ? (
                                <Alert variant="danger" className="text-center">{transactionsError}</Alert>
                            ) : transactions.length === 0 ? (
                                <Alert variant="info" className="text-center">
                                    Aún no tienes transacciones registradas. ¡Empieza a acumular puntos!
                                </Alert>
                            ) : (
                                <ListGroup variant="flush">
                                    {transactions.map(transaction => (
                                        <ListGroup.Item key={transaction.id} className="d-flex justify-content-between align-items-center">
                                            <div>
                                                {transaction.tipo_transaccion === 'compra' ? (
                                                    <>
                                                        <span className="fw-bold text-success">Compra:</span> ${transaction.monto_compra}
                                                        <span className="ms-3 text-success">+{transaction.puntos_cantidad} puntos</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="fw-bold text-warning">Canje:</span> {transaction.nombre_producto_canjeado || 'Producto Desconocido'}
                                                        <span className="ms-3 text-danger">{transaction.puntos_cantidad} puntos</span>
                                                    </>
                                                )}
                                                <div className="text-muted small">
                                                    {formatDateTime(transaction.fecha_transaccion)}
                                                    {transaction.nombre_admin_realizo && ` (por ${transaction.nombre_admin_realizo})`}
                                                </div>
                                            </div>
                                            {/* Puedes añadir más detalles o un ícono aquí si lo deseas */}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default DashboardPage;