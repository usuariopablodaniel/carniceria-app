import React from 'react';
import { Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ProductCard = ({ product, onProductDeleted, userPoints, onRedeemClick }) => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2,
        }).format(price);
    };

    const handleDelete = async () => {
        setError(null);
        if (window.confirm(`¿Estás seguro de que quieres eliminar el producto "${product.nombre}"? Esta acción es irreversible.`)) {
            setLoading(true);
            try {
                const response = await api.delete(`/products/${product.id}`);
                
                if (response.status === 200) {
                    console.log('Producto eliminado:', product.nombre);
                    if (onProductDeleted) {
                        onProductDeleted(product.id);
                    }
                } else {
                    setError(response.data.error || 'Error desconocido al eliminar el producto.');
                }
            } catch (err) {
                console.error('Error al eliminar producto:', err);
                if (err.response) {
                    setError(err.response.data.error || 'No se pudo eliminar el producto.');
                } else if (err.request) {
                    setError('No se pudo conectar con el servidor.');
                } else {
                    setError('Ocurrió un error inesperado.');
                }
            } finally {
                setLoading(false);
            }
        }
    };

    const canRedeem = isAuthenticated && (user?.role === 'user' || user?.role === 'employee') && product.puntos_canje !== null && product.puntos_canje !== undefined;
    const hasEnoughPoints = userPoints !== null && product.puntos_canje <= userPoints;

    return (
        <Card className="h-100 shadow-sm rounded-lg" style={{ border: '1px solid #e0e0e0' }}>
            {error && <Alert variant="danger" className="m-2">{error}</Alert>}
            <Card.Img
                variant="top"
                src={product.imagen_url || 'https://placehold.co/400x200/cccccc/000000?text=Sin+Imagen'}
                alt={product.nombre}
                style={{ height: '180px', objectFit: 'cover', borderTopLeftRadius: 'calc(.25rem - 1px)', borderTopRightRadius: 'calc(.25rem - 1px)' }}
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x200/cccccc/000000?text=Error+Carga+Imagen'; }}
            />
            <Card.Body className="d-flex flex-column p-3">
                <Card.Title className="text-truncate mb-2 fw-bold text-dark">{product.nombre}</Card.Title>
                
                <Card.Text 
                    className="text-muted small mb-2 text-wrap" 
                    title={product.descripcion && product.descripcion.length > 70 ? product.descripcion : ''}
                    style={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minHeight: '3em'
                    }}
                >
                    {product.descripcion || 'Sin descripción.'}
                </Card.Text>
                
                <div className="mt-auto pt-2">
                    {product.puntos_canje !== null && product.puntos_canje !== undefined ? (
                        <Card.Text className="mb-1 text-success fw-bold fs-5">
                            {product.puntos_canje} Puntos
                        </Card.Text>
                    ) : (
                        <Card.Text className="mb-1 text-primary fw-bold fs-5">
                            {formatPrice(product.precio)} / {product.unidad_de_medida}
                        </Card.Text>
                    )}

                    <Card.Text className="mb-1 text-secondary">
                        Stock: {product.stock}
                    </Card.Text>
                    {product.categoria && (
                        <Badge bg="info" className="mt-2 text-uppercase fw-normal py-1 px-2">
                            {product.categoria}
                        </Badge>
                    )}
                </div>

                {isAuthenticated && user && user.role === 'admin' && (
                    <div className="d-flex justify-content-between mt-3">
                        <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="flex-fill me-1"
                            onClick={() => navigate(`/products/edit/${product.id}`)}
                            disabled={loading}
                        >
                            Editar
                        </Button>
                        <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="flex-fill ms-1"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Eliminar'}
                        </Button>
                    </div>
                )}
                {canRedeem && (
                    <div className="d-grid gap-2 mt-3">
                        <Button 
                            variant={hasEnoughPoints ? "success" : "outline-secondary"} 
                            size="md" 
                            disabled={!hasEnoughPoints}
                            onClick={() => onRedeemClick(product)}
                        >
                            {hasEnoughPoints ? `Canjear por ${product.puntos_canje} Puntos` : 'Puntos Insuficientes'}
                        </Button>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default ProductCard;