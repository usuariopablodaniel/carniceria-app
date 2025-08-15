// frontend/src/pages/ProductListPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Spinner, Alert, Button, Card, Image, Modal } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ProductListPage = () => {
    const [saleProducts, setSaleProducts] = useState([]);
    const [pointsProducts, setPointsProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    const renderSafeValue = useCallback((value, fallback = '') => {
        if (typeof value === 'object' && value !== null) {
            return fallback;
        }
        return value;
    }, []);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/products');
            const allProducts = Array.isArray(response.data) ? response.data : [];

            // Filtramos los productos en dos listas separadas y precisas
            const saleItems = allProducts.filter(product => product.precio && !product.puntos_canje);
            const pointsItems = allProducts.filter(product => product.puntos_canje && !product.precio);

            setSaleProducts(saleItems);
            setPointsProducts(pointsItems);
        } catch (err) {
            console.error("Error al obtener los productos:", err);
            if (err.response) {
                setError(err.response.data.error || "No se pudieron cargar los productos. Por favor, intenta de nuevo.");
            } else if (err.request) {
                setError("No se pudo conectar con el servidor. Verifica tu conexión.");
            } else {
                setError("Ocurrió un error inesperado al cargar los productos.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleAddProductClick = () => {
        navigate('/products/add');
    };

    const handleEditProductClick = (productId) => {
        navigate(`/products/edit/${productId}`);
    };
    
    const handleDeleteProduct = (product) => {
        setProductToDelete(product);
        setShowDeleteModal(true);
    };

    const confirmDeleteProduct = async () => {
        try {
            await api.delete(`/products/${productToDelete.id}`); 
            setShowDeleteModal(false);
            setProductToDelete(null);
            fetchProducts();
        } catch (err) {
            console.error("Error al eliminar el producto:", err);
            setShowDeleteModal(false);
            setProductToDelete(null);
            setError("No se pudo eliminar el producto. Intenta de nuevo.");
        }
    };

    const cancelDeleteProduct = () => {
        setShowDeleteModal(false);
        setProductToDelete(null);
    };

    const renderProductCards = (productsToRender) => (
        <Row xs={1} md={2} lg={3} className="g-4">
            {productsToRender.map(product => (
                <Col key={product.id}> 
                    <Card className="h-100 shadow-sm rounded-lg">
                        <Image
                            variant="top"
                            src={product.imagen_url}
                            alt={renderSafeValue(product.nombre, 'Producto sin nombre')}
                            style={{ height: '200px', width: '100%', objectFit: 'cover' }}
                            loading="lazy"
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x200/cccccc/000000?text=Error+Carga+Imagen'; }}
                        />
                        <Card.Body className="d-flex flex-column">
                            <Card.Title className="text-truncate" title={renderSafeValue(product.nombre, 'Producto sin nombre')}>
                                {renderSafeValue(product.nombre, 'Producto sin nombre')}
                            </Card.Title>
                            <Card.Text className="text-muted small mb-2">
                                {renderSafeValue(product.descripcion) || 'Sin descripción.'}
                            </Card.Text>
                            <div className="mt-auto">
                                {product.precio ? (
                                    <h5 className="text-primary mb-2">
                                        ${parseFloat(product.precio).toFixed(2)}
                                    </h5>
                                ) : product.puntos_canje ? (
                                    <h5 className="text-success mb-2">
                                        {product.puntos_canje} Puntos
                                    </h5>
                                ) : (
                                    <h5 className="text-muted mb-2">N/A</h5>
                                )}
                                {user && user.role === 'admin' && (
                                    <div className="d-flex justify-content-between mt-3">
                                        <Button variant="warning" size="sm" onClick={() => handleEditProductClick(product.id)} className="me-2 flex-grow-1">
                                            Editar
                                        </Button>
                                        <Button variant="danger" size="sm" onClick={() => handleDeleteProduct(product)} className="flex-grow-1">
                                            Eliminar
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    );

    if (error) {
        return (
            <Container className="my-5 d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-75">
                    {error}
                    <Button variant="danger" onClick={fetchProducts} className="ms-3 mt-2">Reintentar</Button>
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="my-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="text-dark">Nuestros Productos</h1>
                {user && user.role === 'admin' && (
                    <Button variant="success" onClick={handleAddProductClick}>
                        + Añadir Producto
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="d-flex flex-column align-items-center justify-content-center text-center py-5" style={{ minHeight: '400px' }}>
                    <Spinner animation="border" role="status" className="mb-3 text-primary" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Cargando productos...</span>
                    </Spinner>
                    <p className="text-muted">Cargando productos, por favor espera...</p>
                </div>
            ) : (
                <>
                    {saleProducts.length > 0 && (
                        <>
                            <h2 className="text-dark mb-3">Ofertas</h2>
                            {renderProductCards(saleProducts)}
                        </>
                    )}

                    {pointsProducts.length > 0 && (
                        <>
                            <h2 className="text-dark mt-5 mb-3">Canje por Puntos</h2>
                            {renderProductCards(pointsProducts)}
                        </>
                    )}

                    {saleProducts.length === 0 && pointsProducts.length === 0 && (
                        <Alert variant="info" className="text-center my-5 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '300px' }}>
                            <p className="mb-3 fs-5">¡Ups! Parece que no hay productos disponibles en este momento.</p>
                            {user && user.role === 'admin' && (
                                <Button variant="primary" onClick={handleAddProductClick}>
                                    Sé el primero en añadir un producto
                                </Button>
                            )}
                        </Alert>
                    )}
                </>
            )}

            <Modal show={showDeleteModal} onHide={cancelDeleteProduct} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Eliminación</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    ¿Estás seguro de que quieres eliminar el producto <strong>{productToDelete?.nombre || ''}</strong>? Esta acción no se puede deshacer.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={cancelDeleteProduct}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={confirmDeleteProduct}>
                        Eliminar
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ProductListPage;