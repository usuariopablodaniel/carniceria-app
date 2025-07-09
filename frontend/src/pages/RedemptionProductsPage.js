// frontend/src/pages/RedemptionProductsPage.js
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

const RedemptionProductsPage = () => {
    const { user, isAuthenticated, loadingAuth } = useAuth();
    const navigate = useNavigate(); // Inicializar useNavigate
    const [redemptionProducts, setRedemptionProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userPoints, setUserPoints] = useState(null);

    // Función para obtener los puntos del usuario actual
    useEffect(() => {
        const fetchUserPoints = async () => {
            if (!isAuthenticated || !user || !user.id) {
                setUserPoints(0);
                return;
            }
            try {
                const response = await axios.get(`/transactions/${user.id}/points`);
                setUserPoints(response.data.points);
            } catch (err) {
                console.error('Error al obtener los puntos del usuario:', err);
                setUserPoints(null); 
            }
        };

        if (!loadingAuth) {
            fetchUserPoints();
        }
    }, [isAuthenticated, user, loadingAuth]);

    // Función para obtener los productos de canje
    useEffect(() => {
        const fetchRedemptionProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get('/products');
                const redeemable = response.data.filter(p => p.puntos_canje !== null && p.puntos_canje > 0);
                setRedemptionProducts(redeemable);
            } catch (err) {
                console.error('Error al cargar productos de canje:', err);
                setError('No se pudieron cargar los productos disponibles para canje.');
            } finally {
                setLoading(false);
            }
        };

        fetchRedemptionProducts();
    }, []);

    // >>>>>>>>>>>>>>> NUEVA FUNCIÓN PARA MANEJAR EL CLIC EN CANJEAR <<<<<<<<<<<<<<<<
    const handleRedeemClick = (productName) => {
        if (isAuthenticated) {
            // Redirigir al dashboard con un mensaje
            navigate('/dashboard', { 
                state: { 
                    message: `¡Excelente! Muestra tu código QR al vendedor para canjear "${productName}".`,
                    variant: 'success'
                } 
            });
        } else {
            // Si no está autenticado, redirigir al login
            navigate('/login', {
                state: {
                    message: 'Inicia sesión para canjear puntos.',
                    variant: 'warning'
                }
            });
        }
    };

    if (loading) {
        return (
            <Container className="my-5 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando productos...</span>
                </Spinner>
                <p className="mt-3">Cargando productos disponibles para canje...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="my-5 text-center">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container className="my-5">
            <h1 className="text-center mb-4 text-primary">Canje por Puntos</h1>
            <p className="text-center text-muted mb-4">
                ¡Aquí puedes ver los productos que puedes canjear con tus puntos!
            </p>

            {isAuthenticated && userPoints !== null && (
                <Alert variant="info" className="text-center mb-4">
                    Tus puntos actuales: <strong className="fs-5">{userPoints}</strong>
                </Alert>
            )}
            {!isAuthenticated && (
                <Alert variant="warning" className="text-center mb-4">
                    <p className="mb-0">Inicia sesión para ver tus puntos y saber qué puedes canjear.</p>
                    <Button variant="link" href="/login">Iniciar Sesión</Button>
                </Alert>
            )}

            {redemptionProducts.length === 0 ? (
                <Alert variant="info" className="text-center">
                    No hay productos disponibles para canje en este momento. ¡Vuelve pronto!
                </Alert>
            ) : (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {redemptionProducts.map(product => (
                        <Col key={product.id}>
                            <Card className="h-100 shadow-sm rounded-lg">
                                {product.imagen_url ? (
                                    <Card.Img 
                                        variant="top" 
                                        src={product.imagen_url} 
                                        alt={product.nombre} 
                                        style={{ height: '200px', objectFit: 'cover' }} 
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x200/cccccc/000000?text=Sin+Imagen'; }}
                                    />
                                ) : (
                                    <div style={{ height: '200px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                        Sin Imagen
                                    </div>
                                )}
                                <Card.Body className="d-flex flex-column">
                                    <Card.Title className="text-truncate" title={product.nombre}>{product.nombre}</Card.Title>
                                    <Card.Text className="text-muted small mb-2">
                                        {product.descripcion || 'Sin descripción.'}
                                    </Card.Text>
                                    <div className="mt-auto">
                                        <h5 className="text-success mb-2">
                                            <i className="bi bi-star-fill me-1"></i>
                                            {product.puntos_canje} Puntos
                                        </h5>
                                        {isAuthenticated && userPoints !== null && (
                                            product.puntos_canje <= userPoints ? (
                                                // >>>>>>>>>>>>>>> BOTÓN HABILITADO Y CON REDIRECCIÓN <<<<<<<<<<<<<<<<
                                                <Button 
                                                    variant="success" 
                                                    className="w-100" 
                                                    onClick={() => handleRedeemClick(product.nombre)}
                                                >
                                                    ¡Canjear Ahora!
                                                </Button>
                                            ) : (
                                                <Button variant="outline-secondary" className="w-100" disabled>
                                                    Puntos Insuficientes
                                                </Button>
                                            )
                                        )}
                                        {!isAuthenticated && (
                                            <Button variant="outline-secondary" className="w-100" disabled>
                                                Inicia Sesión para Canjear
                                            </Button>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default RedemptionProductsPage;