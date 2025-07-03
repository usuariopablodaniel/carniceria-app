import React from 'react';
import { Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

// Añadimos 'onProductDeleted' como prop, para que el componente padre (ProductListPage)
// sepa cuándo un producto ha sido eliminado y pueda recargar la lista.
const ProductCard = ({ product, onProductDeleted }) => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    // Función para formatear el precio a moneda argentina (ARS)
    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2,
        }).format(price);
    };

    // Función para manejar imagen_url vacía o error
    const getImageUrl = (url) => {
        if (!url || url.trim() === '') {
            // >>>>>>>>>>>>>>> ESTA ES LA RUTA PARA TUS IMÁGENES LOCALES <<<<<<<<<<<<<<<<
            // Asegúrate de que esta imagen exista en src/assets/images/placeholder.png
            // O, si sigues mi recomendación de la carpeta public: /images/placeholder.png
            // He cambiado a rutas relativas a `public` que son más sencillas para assets estáticos.
            return '/images/placeholder.png'; 
        }
        return url;
    };

    // Función para manejar errores de carga de imagen
    const handleImageError = (e) => {
        e.target.onerror = null;
        // >>>>>>>>>>>>>>> ESTA ES LA RUTA PARA TUS IMÁGENES LOCALES <<<<<<<<<<<<<<<<
        // Asegúrate de que esta imagen exista en src/assets/images/error_image.png
        // O, si sigues mi recomendación de la carpeta public: /images/error_image.png
        e.target.src = '/images/error_image.png'; // Fallback final
    };

    const handleDelete = async () => {
        setError(null);
        if (window.confirm(`¿Estás seguro de que quieres eliminar el producto "${product.nombre}"? Esta acción es irreversible.`)) {
            setLoading(true);
            try {
                const response = await axios.delete(`/products/${product.id}`); 
                
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

    return (
        <Card className="h-100 shadow-sm rounded-lg" style={{ border: '1px solid #e0e0e0' }}>
            {error && <Alert variant="danger" className="m-2">{error}</Alert>}
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
                    {/* >>>>>>>>>>>>> LÓGICA CONDICIONAL PARA PRECIO O PUNTOS_CANJE <<<<<<<<<<<<< */}
                    {product.puntos_canje !== null && product.puntos_canje !== undefined ? (
                        <Card.Text className="mb-1 text-success fw-bold fs-5">
                            {product.puntos_canje} Puntos
                        </Card.Text>
                    ) : (
                        <Card.Text className="mb-1 text-primary fw-bold fs-5">
                            {formatPrice(product.precio)} / {product.unidad_de_medida}
                        </Card.Text>
                    )}
                    {/* >>>>>>>>>>>>> FIN LÓGICA CONDICIONAL <<<<<<<<<<<<< */}

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
                {/* >>>>>>>>> Botón para canjear productos (visible para usuarios normales en la página de canje) <<<<<<<<< */}
                {isAuthenticated && user && user.role === 'user' && product.puntos_canje !== null && product.puntos_canje !== undefined && (
                    <div className="d-grid gap-2 mt-3">
                        <Button variant="success" size="md">
                            Canjear por {product.puntos_canje} Puntos
                        </Button>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default ProductCard;