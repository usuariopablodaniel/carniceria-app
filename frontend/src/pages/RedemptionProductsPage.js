import React, { useEffect, useState, useCallback } from 'react';
import { Container, Spinner, Alert, Button } from 'react-bootstrap'; 
import api from '../api/axios'; 
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import RedeemProductList from './RedeemProductList'; // <== AQUI ESTA LA MAGIA

const RedemptionProductsPage = () => {
    const { user, isAuthenticated, loadingAuth } = useAuth();
    const navigate = useNavigate();
    const [redemptionProducts, setRedemptionProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userPoints, setUserPoints] = useState(null);

    const fetchUserPoints = useCallback(async () => {
        if (!isAuthenticated || !user || !user.id) {
            setUserPoints(0);
            return;
        }
        try {
            const response = await api.get(`/transactions/${user.id}/points`); 
            setUserPoints(response.data.points);
        } catch (err) {
            console.error('Error al obtener los puntos del usuario:', err);
            setUserPoints(null);
        }
    }, [isAuthenticated, user]);

    const fetchRedemptionProducts = useCallback(async () => { 
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/products'); 
            const redeemable = response.data.filter(p => p.puntos_canje !== null && p.puntos_canje > 0);
            setRedemptionProducts(redeemable);
        } catch (err) {
            console.error('Error al cargar productos de canje:', err);
            setError('No se pudieron cargar los productos disponibles para canje.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!loadingAuth) {
            fetchUserPoints();
        }
    }, [isAuthenticated, user, loadingAuth, fetchUserPoints]);

    useEffect(() => {
        fetchRedemptionProducts();
    }, [fetchRedemptionProducts]);

    const handleAddProductClick = () => {
        navigate('/products/add');
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
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="text-primary">Canje por Puntos</h1>
                {user && user.role === 'admin' && (
                    <Button variant="success" onClick={handleAddProductClick}>
                        + Añadir Producto de Canje
                    </Button>
                )}
            </div>
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
            
            {/* <== ELIMINAMOS EL MAPEO AQUÍ Y USAMOS EL COMPONENTE SEPARADO ==> */}
            <RedeemProductList products={redemptionProducts} userPoints={userPoints} />
        </Container>
    );
};

export default RedemptionProductsPage;