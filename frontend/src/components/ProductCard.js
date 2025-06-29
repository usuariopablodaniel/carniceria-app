import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // Si quieres ver detalles o editar/eliminar
import { useAuth } from '../context/AuthContext'; // Para mostrar botones de admin

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth(); // Obtener estado de autenticación y usuario

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
    // Si la URL es nula, vacía o indefinida, usa una imagen por defecto
    if (!url || url.trim() === '') {
      return 'https://via.placeholder.com/180x180?text=Sin+Imagen'; // O una imagen de logo de tu carnicería
    }
    return url;
  };

  // Función para manejar errores de carga de imagen
  const handleImageError = (e) => {
    e.target.onerror = null; // Previene bucles infinitos de error
    e.target.src = 'https://via.placeholder.com/180x180?text=Error+Carga+Imagen'; // Fallback final
  };

  return (
    <Card className="h-100 shadow-sm rounded-lg" style={{ border: '1px solid #e0e0e0' }}> {/* Agregamos borde y esquinas redondeadas */}
      <Card.Img
        variant="top"
        src={getImageUrl(product.imagen_url)}
        alt={product.nombre}
        style={{ height: '180px', objectFit: 'cover', borderTopLeftRadius: 'calc(.25rem - 1px)', borderTopRightRadius: 'calc(.25rem - 1px)' }} // Bordes redondeados top
        onError={handleImageError}
      />
      <Card.Body className="d-flex flex-column p-3"> {/* Padding ligeramente más grande */}
        <Card.Title className="text-truncate mb-2 fw-bold text-dark">{product.nombre}</Card.Title> {/* Fuente más bold */}
        
        {/* Descripción truncada con tooltip opcional, si es demasiado larga */}
        <Card.Text 
          className="text-muted small mb-2 text-wrap" 
          title={product.descripcion && product.descripcion.length > 70 ? product.descripcion : ''} // Tooltip solo si la descripción es larga
          style={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2, // Limita a 2 líneas
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: '3em' // Altura mínima para descripciones cortas
          }}
        >
          {product.descripcion || 'Sin descripción.'}
        </Card.Text>
        
        <div className="mt-auto pt-2"> {/* Empuja el contenido de precio y stock hacia abajo */}
          <Card.Text className="mb-1 text-primary fw-bold fs-5"> {/* Precio más destacado */}
            {formatPrice(product.precio)} / {product.unidad_de_medida}
          </Card.Text>
          <Card.Text className="mb-1 text-secondary">
            Stock: {product.stock}
          </Card.Text>
          {product.categoria && (
            <Badge bg="info" className="mt-2 text-uppercase fw-normal py-1 px-2"> {/* Badge más estilizado */}
              {product.categoria}
            </Badge>
          )}
        </div>

        {/* Botones de acción solo para administradores */}
        {isAuthenticated && user && user.role === 'admin' && (
          <div className="d-flex justify-content-between mt-3">
            <Button 
              variant="outline-primary" 
              size="sm" 
              className="flex-fill me-1"
              onClick={() => navigate(`/products/edit/${product.id}`)} // Ruta para editar
            >
              Editar
            </Button>
            <Button 
              variant="outline-danger" 
              size="sm" 
              className="flex-fill ms-1"
              onClick={() => navigate(`/products/delete/${product.id}`)} // O lanzar modal de confirmación
            >
              Eliminar
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ProductCard;