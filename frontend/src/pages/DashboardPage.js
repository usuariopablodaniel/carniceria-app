// frontend/src/pages/DashboardPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Row, Col, Spinner, Alert, Button, Table } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { FaUserCircle, FaRedoAlt, FaShoppingCart, FaGift, FaExchangeAlt } from 'react-icons/fa';
import axios from '../api/axios';

// Función auxiliar para formatear la fecha
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const DashboardPage = () => {
    const { user, isAuthenticated, loadingAuth, refreshUser, userDetails } = useAuth();
    
    // --- ESTADOS PARA TRANSACCIONES ---
    const [userTransactions, setUserTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [transactionError, setTransactionError] = useState(null);
    // ----------------------------------------

    const [isRefreshing, setIsRefreshing] = useState(false);

    // Lógica para recargar puntos
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshUser(); 
        setIsRefreshing(false);
    };

    // --- EFECTO PARA CARGAR TRANSACCIONES ---
    const fetchUserTransactions = useCallback(async (userId) => {
        if (!userId) return;

        setLoadingTransactions(true);
        setTransactionError(null);
        try {
            // Llama a la ruta: GET /api/transactions/user/:userId
            const response = await axios.get(`/transactions/user/${userId}`);
            setUserTransactions(response.data);
        } catch (err) {
            console.error('DashboardPage: Error al obtener transacciones:', err);
            setTransactionError('Error al cargar las últimas transacciones.');
            setUserTransactions([]);
        } finally {
            setLoadingTransactions(false);
        }
    }, []);

    // Ejecuta la carga de transacciones cuando el usuario está autenticado y tiene ID.
    useEffect(() => {
        if (isAuthenticated && user && user.id) {
            fetchUserTransactions(user.id);
        }
    }, [isAuthenticated, user, fetchUserTransactions]);

    // Lógica de redirección y carga de autenticación (se mantiene)
    if (loadingAuth) {
        return (
            <Container className="my-5 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </Spinner>
            </Container>
        );
    }

    if (!isAuthenticated || !user) {
        return <Alert variant="danger" className="text-center">No autenticado.</Alert>;
    }

    const { nombre, email, role, puntos_disponibles } = userDetails || user;

    return (
        <Container className="my-5 p-4 border rounded shadow-lg bg-light">
            <h1 className="mb-4 text-primary">
                <FaUserCircle className="me-3" /> Dashboard de Usuario
            </h1>

            {/* --- Tarjeta de Información y Puntos --- */}
            <Row className="mb-5">
                <Col md={6} className="mb-3">
                    <Card className="shadow-sm h-100">
                        <Card.Body>
                            <Card.Title className="text-muted">Información Personal</Card.Title>
                            <Card.Text>
                                <strong>Nombre:</strong> {nombre || 'N/A'} <br />
                                <strong>Email:</strong> {email} <br />
                                <strong>Rol:</strong> {role}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} className="mb-3">
                    <Card className="shadow-sm border-warning h-100">
                        <Card.Body className="d-flex flex-column justify-content-between">
                            <div>
                                <Card.Title className="text-warning mb-3">Puntos Acumulados</Card.Title>
                                <h2 className="display-4 text-center mb-4">
                                    {/* LÍNEA 108 CORREGIDA: Se eliminaron los ** que causaban error de parsing */}
                                    {isRefreshing ? <Spinner animation="border" size="sm" /> : puntos_disponibles !== undefined ? puntos_disponibles.toLocaleString() : '---'}
                                </h2>
                            </div>
                            <Button 
                                variant="outline-warning" 
                                onClick={handleRefresh} 
                                disabled={isRefreshing}
                                className="w-100 mt-3"
                            >
                                {isRefreshing ? (
                                    <>
                                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                        Actualizando...
                                    </>
                                ) : (
                                    <><FaRedoAlt className="me-2" /> Actualizar Puntos</>
                                )}
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <hr/>
            
            {/* --- Sección de Últimas Transacciones --- */}
            <Row className="mt-5">
                <Col>
                    <Card className="shadow-sm">
                        <Card.Header as="h5" className="bg-primary text-white">
                            <FaExchangeAlt className="me-2" /> Últimas 10 Transacciones
                        </Card.Header>
                        <Card.Body>
                            {loadingTransactions ? (
                                <div className="text-center py-4">
                                    <Spinner animation="border" />
                                    <p className="mt-2">Cargando historial...</p>
                                </div>
                            ) : transactionError ? (
                                <Alert variant="danger" className="text-center">{transactionError}</Alert>
                            ) : userTransactions.length === 0 ? (
                                <Alert variant="info" className="text-center">Aún no hay transacciones registradas.</Alert>
                            ) : (
                                <Table striped bordered hover responsive size="sm">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Tipo</th>
                                            <th>Monto/Producto</th>
                                            <th>Puntos</th>
                                            <th>Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userTransactions.map((tx, index) => (
                                            <tr key={tx.id}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    {tx.type === 'purchase' ? 
                                                        <><FaShoppingCart className="text-success me-1" /> **Compra**</> : 
                                                        <><FaGift className="text-danger me-1" /> **Canje**</>
                                                    }
                                                </td>
                                                <td>
                                                    {tx.type === 'purchase' ? 
                                                        `$${parseFloat(tx.amount || 0).toFixed(2)}` : 
                                                        tx.product_name || 'Producto Canjeado'
                                                    }
                                                </td>
                                                <td>
                                                    <span className={`fw-bold ${tx.points_change > 0 ? 'text-success' : 'text-danger'}`}>
                                                        {tx.points_change > 0 ? `+${tx.points_change}` : tx.points_change}
                                                    </span>
                                                </td>
                                                <td>{formatDate(tx.transaction_date)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            {/* --- Fin Sección Transacciones --- */}
        </Container>
    );
};

export default DashboardPage;