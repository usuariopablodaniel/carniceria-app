// frontend/src/pages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Spinner, Alert, ListGroup, Button, Modal } from 'react-bootstrap';
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

    // NUEVOS ESTADOS PARA EL HISTORIAL DE TRANSACCIONES
    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [transactionsError, setTransactionsError] = useState(null);

    // Estado para el mensaje de redirección
    const [redirectMessage, setRedirectMessage] = useState(null);
    const [messageVariant, setMessageVariant] = useState('info');

    // Estado para el valor del QR
    const [qrValue, setQrValue] = useState('');

    // ESTADOS Y FUNCIONES PARA EL MODAL
    const [showModal, setShowModal] = useState(false);
    const handleShowModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);

    // Efecto para manejar mensajes de redirección y generar el QR
    useEffect(() => {
        if (location.state && location.state.message) {
            setRedirectMessage(location.state.message);
            setMessageVariant(location.state.variant || 'info');
            window.history.replaceState({}, document.title); 
        }

        if (location.state?.canjeo) {
            const { productToRedeem } = location.state;
            const canjeData = {
                userId: user.id,
                productId: productToRedeem.id,
                productName: productToRedeem.nombre,
                timestamp: new Date().toISOString(),
            };
            setQrValue(JSON.stringify(canjeData));
        } else {
            if (user && user.id) {
                setQrValue(user.id.toString());
            }
        }
    }, [location.state, user]);

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

    // EFECTO PARA OBTENER EL HISTORIAL DE TRANSACCIONES
    useEffect(() => {
        const fetchTransactionsHistory = async () => {
            if (!isAuthenticated || !user || !user.id) {
                setLoadingTransactions(false);
                return;
            }
            try {
                setLoadingTransactions(true);
                setTransactionsError(null);
                // Asumimos que el backend devuelve la lista ordenada por fecha DESC
                const response = await axios.get(`/transactions/history/${user.id}`);
                setTransactions(response.data);
            } catch (err) {
                console.error('Error al obtener el historial de transacciones:', err);
                setTransactionsError('No se pudo cargar tu historial de transacciones.');
            } finally {
                setLoadingTransactions(false);
            }
        };

        if (!loadingAuth) {
            fetchTransactionsHistory();
        }
    }, [isAuthenticated, user, loadingAuth]);

    const formatDateTime = (isoString) => {
        if (!isoString) return '';
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

    // Helper para renderizar un item de transacción
    const renderTransactionItem = (transaction) => (
        <ListGroup.Item key={transaction.id || Math.random()} className="d-flex justify-content-between align-items-center">
            <div className="w-100">
                <div className="d-flex justify-content-between">
                    <div>
                        {transaction.tipo_transaccion === 'compra' ? (
                            <>
                                <span className="fw-bold text-success">Compra</span>
                                <span className="mx-2 text-muted">|</span>
                                <span>${transaction.monto_compra}</span>
                            </>
                        ) : (
                            <>
                                <span className="fw-bold text-warning">Canje</span>
                                <span className="mx-2 text-muted">|</span>
                                <span>{transaction.nombre_producto_canjeado || 'Producto'}</span>
                            </>
                        )}
                    </div>
                    <div>
                        {transaction.tipo_transaccion === 'compra' ? (
                            <span className="badge bg-success">+{transaction.puntos_cantidad} pts</span>
                        ) : (
                            <span className="badge bg-danger">{transaction.puntos_cantidad} pts</span>
                        )}
                    </div>
                </div>
                <div className="text-muted small mt-1">
                    {formatDateTime(transaction.fecha_transaccion)}
                    {transaction.nombre_admin_realizo && ` (Atendido por: ${transaction.nombre_admin_realizo})`}
                </div>
            </div>
        </ListGroup.Item>
    );

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
                            {location.state?.canjeo ? (
                                <>
                                    <Card.Title className="mb-3">Código de Canje</Card.Title>
                                    <div className="d-flex justify-content-center mb-3">
                                        {qrValue ? (
                                            <QRCodeCanvas value={qrValue} size={180} level="H" includeMargin={true} />
                                        ) : <Spinner animation="border" />}
                                    </div>
                                    <p className="fw-bold mt-2">Muestra este QR para canjear.</p>
                                </>
                            ) : (
                                <>
                                    <Card.Title className="mb-3">Tu Código QR</Card.Title>
                                    <div className="d-flex justify-content-center mb-3">
                                        {qrValue ? (
                                            <QRCodeCanvas value={qrValue} size={180} level="H" includeMargin={true} />
                                        ) : <Spinner animation="border" />}
                                    </div>
                                    <p className="fw-bold mt-2">ID: {user?.id}</p>
                                    <Card.Text className="text-muted small">
                                        Para sumar puntos o canjear premios.
                                    </Card.Text>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* SECCIÓN DE HISTORIAL DE TRANSACCIONES */}
            <Row className="mt-4">
                <Col>
                    <Card className="shadow-sm rounded-lg">
                        <Card.Body>
                            <Card.Title className="text-center mb-3">Últimas Transacciones</Card.Title>
                            {loadingTransactions ? (
                                <div className="text-center py-3">
                                    <Spinner animation="border" size="sm" />
                                </div>
                            ) : transactionsError ? (
                                <Alert variant="danger" className="text-center">{transactionsError}</Alert>
                            ) : transactions.length === 0 ? (
                                <Alert variant="info" className="text-center">
                                    Aún no tienes movimientos registrados.
                                </Alert>
                            ) : (
                                <>
                                    <ListGroup variant="flush">
                                        {/* AQUÍ SE MUESTRAN SOLO LAS ÚLTIMAS 5 */}
                                        {transactions.slice(0, 5).map(transaction => renderTransactionItem(transaction))}
                                    </ListGroup>
                                    
                                    {transactions.length > 5 && (
                                        <div className="text-center mt-3">
                                            <Button variant="outline-primary" size="sm" onClick={handleShowModal}>
                                                Ver Historial Completo
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* MODAL HISTORIAL COMPLETO */}
            <Modal show={showModal} onHide={handleCloseModal} centered size="lg" scrollable>
                <Modal.Header closeButton>
                    <Modal.Title>Historial Completo</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {transactions.length === 0 ? (
                        <Alert variant="info">No hay datos.</Alert>
                    ) : (
                        <ListGroup variant="flush">
                            {transactions.map(transaction => renderTransactionItem(transaction))}
                        </ListGroup>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default DashboardPage;