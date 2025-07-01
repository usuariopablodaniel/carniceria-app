import React from 'react';
import { Card, Button, Badge, Alert, Spinner } from 'react-bootstrap'; // Agregamos Alert y Spinner para posibles mensajes/estados locales
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios'; // Importar la instancia de Axios configurada

// Añadimos 'onProductDeleted' como prop, para que el componente padre (ProductListPage)
// sepa cuándo un producto ha sido eliminado y pueda recargar la lista.
const ProductCard = ({ product, onProductDeleted }) => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [loading, setLoading] = React.useState(false); // Estado para indicar que la eliminación está en curso
    const [error, setError] = React.useState(null); // Estado para errores de eliminación

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2,
        }).format(price);
    };

    const getImageUrl = (url) => {
        if (!url || url.trim() === '') {
            return 'https://via.placeholder.com/180x180?text=Sin+Imagen';
        }
        return url;
    };

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = 'https://via.placeholder.com/180x180?text=Error+Carga+Imagen';
    };

    const handleDelete = async () => {
        setError(null); // Limpiar errores previos
        if (window.confirm(`¿Estás seguro de que quieres eliminar el producto "${product.nombre}"? Esta acción es irreversible.`)) {
            setLoading(true); // Indicar que la eliminación está en progreso
            try {
                // Axios ya incluye el token por el interceptor
                const response = await axios.delete(`/products/${product.id}`); 
                
                if (response.status === 200) { // 200 OK para DELETE exitoso
                    console.log('Producto eliminado:', product.nombre);
                    if (onProductDeleted) {
                        onProductDeleted(product.id); // Notificar al padre que el producto fue eliminado
                    }
                } else {
                    // Axios debería capturar esto en el catch, pero por si acaso
                    setError(response.data.error || 'Error desconocido al eliminar el producto.');
                }
            } catch (err) {
                console.error('Error al eliminar producto:', err);
                if (err.response) {
                    // Error de la API (ej. 403 Forbidden, 404 Not Found)
                    setError(err.response.data.error || 'No se pudo eliminar el producto.');
                } else if (err.request) {
                    // La petición fue hecha pero no hubo respuesta
                    setError('No se pudo conectar con el servidor.');
                } else {
                    // Otros errores
                    setError('Ocurrió un error inesperado.');
                }
            } finally {
                setLoading(false); // Finalizar el estado de carga
            }
        }
    };

    return (
        <Card className="h-100 shadow-sm rounded-lg" style={{ border: '1px solid #e0e0e0' }}>
            {error && <Alert variant="danger" className="m-2">{error}</Alert>} {/* Mostrar error si existe */}
            <Card.Img
                variant="top"
                src={getImageUrl(product.imagen_url)}
                alt={product.nombre}
                style={{ height: '180px', objectFit: 'cover', borderTopLeftRadius: 'calc(.25rem - 1px)', borderTopRightRadius: 'calc(.25rem - 1px)' }}
                onError={handleImageError}
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
                    <Card.Text className="mb-1 text-primary fw-bold fs-5">
                        {formatPrice(product.precio)} / {product.unidad_de_medida}
                    </Card.Text>
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
                            disabled={loading} // Deshabilitar si se está eliminando
                        >
                            Editar
                        </Button>
                        <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="flex-fill ms-1"
                            onClick={handleDelete} // Cambiamos el onClick para llamar a handleDelete
                            disabled={loading} // Deshabilitar durante la eliminación
                        >
                            {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Eliminar'}
                        </Button>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default ProductCard;