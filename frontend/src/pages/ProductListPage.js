// frontend/src/pages/ProductListPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Spinner, Alert, Button, Card, Image, Modal } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ProductListPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Función de utilidad para renderizar valores de forma segura.
    // Evita el error "Objects are not valid as a React child".
    const renderSafeValue = useCallback((value, fallback = '') => {
        if (typeof value === 'object' && value !== null) {
            return fallback;
        }
        return value;
    }, []);

    const getFullImageUrl = useCallback((relativePath) => {
        if (!relativePath) {
            return 'https://placehold.co/400x200/cccccc/000000?text=Sin+Imagen';
        }
        const baseUrlWithoutApi = api.defaults.baseURL.replace('/api', '');
        
        if (relativePath.startsWith('/api/images/')) {
            return `${baseUrlWithoutApi}${relativePath}`;
        } else {
            return `${api.defaults.baseURL}/images/${relativePath}`;
        }
    }, []);

    const fetchProducts = useCallback(async () => { // Añadido useCallback para memoizar la función
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/products');
            const saleProducts = Array.isArray(response.data) ?
                response.data.filter(product =>
                    (renderSafeValue(product.precio) !== null && renderSafeValue(product.precio) !== undefined) &&
                    (renderSafeValue(product.puntos_canje) === null || renderSafeValue(product.puntos_canje) === undefined)
                ) : [];
            setProducts(saleProducts);
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
    }, [renderSafeValue]); // Dependencia para useCallback, ya que renderSafeValue se usa dentro

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]); // <-- 'fetchProducts' añadido aquí para resolver la advertencia de dependencia

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
            // Se usa productToDelete.id para coincidir con la respuesta del backend
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
                <h1 className="text-dark">Nuestras Ofertas y Productos en Venta</h1>
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
                    <Row className="mt-4 w-100 justify-content-center">
                        {Array.from({ length: 4 }).map((_, index) => (
                            // Se usa el index como key para los placeholders, ya que son estáticos
                            <Col key={index} xs={12} sm={6} md={4} lg={3} className="mb-4"> 
                                <div className="placeholder-glow">
                                    <div className="card h-100 shadow-sm rounded-lg" style={{ border: '1px solid #e0e0e0' }}>
                                        <div className="card-img-top bg-light" style={{ height: '180px', width: '100%' }}></div>
                                        <div className="card-body p-3">
                                            {/* Añadido contenido para accesibilidad */}
                                            <h5 className="card-title placeholder col-8 mb-2">Cargando Título</h5> 
                                            <p className="card-text placeholder col-6">Cargando descripción</p>
                                            <p className="card-text placeholder col-4">Cargando precio</p>
                                            <span className="badge bg-secondary placeholder col-3">Cargando categoría</span>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>
            ) : products.length === 0 ? (
                <Alert variant="info" className="text-center my-5 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '300px' }}>
                    <p className="mb-3 fs-5">¡Ups! Parece que no hay productos disponibles en este momento.</p>
                    {user && user.role === 'admin' && (
                        <Button variant="primary" onClick={handleAddProductClick}>
                            Sé el primero en añadir un producto
                        </Button>
                    )}
                </Alert>
            ) : (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {products.map(product => (
                        // Se usa product.id como key, ya que es el identificador único del backend
                        <Col key={product.id}> 
                            <Card className="h-100 shadow-sm rounded-lg">
                                <Image
                                    variant="top"
                                    src={getFullImageUrl(product.imagen_url)}
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
                                        <h5 className="text-primary mb-2">
                                            ${renderSafeValue(product.precio) !== null && renderSafeValue(product.precio) !== undefined
                                                ? parseFloat(renderSafeValue(product.precio)).toFixed(2)
                                                : 'N/A'
                                            }
                                        </h5>
                                        {user && user.role === 'admin' && (
                                            <div className="d-flex justify-content-between mt-3">
                                                {/* Se pasa product.id para la edición */}
                                                <Button variant="warning" size="sm" onClick={() => handleEditProductClick(product.id)} className="me-2 flex-grow-1">
                                                    Editar
                                                </Button>
                                                {/* Se pasa el objeto product completo para el modal de eliminación */}
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
            )}

            {/* Modal de confirmación de eliminación */}
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

