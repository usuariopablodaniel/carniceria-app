import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap';
import axios from '../api/axios';

const ProductAddPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, loadingAuth } = useAuth(); 

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: '',
        unidad_de_medida: 'kg',
        imagen_url: '',
        categoria: '',
        disponible: true,
        // >>>>>>>>>>>>>>> NUEVO CAMPO: puntos_canje <<<<<<<<<<<<<<<<
        puntos_canje: '', 
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (loadingAuth) {
            return; 
        }

        if (!isAuthenticated) {
            navigate('/login', { replace: true });
            return;
        }

        if (user && user.role !== 'admin') {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate, isAuthenticated, loadingAuth]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSubmitting(true);

        // >>>>>>>>>>>>>>> CORRECCIÓN EN VALIDACIONES <<<<<<<<<<<<<<<<
        // Validar que nombre y stock sean obligatorios (precio ya no se valida aquí)
        if (!formData.nombre || !formData.stock) {
            setError('Nombre y Stock son obligatorios.');
            setIsSubmitting(false);
            return;
        }

        // Determinar si se ingresó precio o puntos de canje
        const hasPriceInput = formData.precio !== '' && formData.precio !== null;
        const hasPointsInput = formData.puntos_canje !== '' && formData.puntos_canje !== null;

        // Validar que se ingrese uno y solo uno de los dos (precio o puntos)
        if (!hasPriceInput && !hasPointsInput) {
            setError('Debe ingresar un Precio o Puntos de Canje para el producto.');
            setIsSubmitting(false);
            return;
        }
        if (hasPriceInput && hasPointsInput) {
            setError('No puede ingresar Precio y Puntos de Canje a la vez. Elija uno.');
            setIsSubmitting(false);
            return;
        }

        // Validar el precio si fue ingresado
        if (hasPriceInput) {
            const parsedPrice = parseFloat(formData.precio);
            if (isNaN(parsedPrice) || parsedPrice <= 0) {
                setError('El precio debe ser un número positivo.');
                setIsSubmitting(false);
                return;
            }
        }

        // Validar los puntos de canje si fueron ingresados
        if (hasPointsInput) {
            const parsedPoints = parseInt(formData.puntos_canje);
            if (isNaN(parsedPoints) || parsedPoints < 0) { // Puntos pueden ser 0
                setError('Los puntos de canje deben ser un número no negativo.');
                setIsSubmitting(false);
                return;
            }
        }

        // Validar stock (lo muevo aquí abajo para que se ejecute después de las validaciones de precio/puntos)
        const parsedStock = parseInt(formData.stock);
        if (isNaN(parsedStock) || parsedStock < 0) {
            setError('El stock debe ser un número no negativo.');
            setIsSubmitting(false);
            return;
        }
        // >>>>>>>>>>>>>>> FIN CORRECCIÓN EN VALIDACIONES <<<<<<<<<<<<<<<<

        try {
            const productData = {
                ...formData,
                // Asegurarse de enviar null si el campo está vacío o no es aplicable
                precio: hasPriceInput ? parseFloat(formData.precio) : null,
                puntos_canje: hasPointsInput ? parseInt(formData.puntos_canje) : null,
                stock: parsedStock, // Ya validado y parseado
            };

            const response = await axios.post('/products', productData); 
            
            if (response.status === 201) {
                setMessage('Producto añadido exitosamente!');
                setFormData({ // Limpiar el formulario y resetear puntos_canje
                    nombre: '',
                    descripcion: '',
                    precio: '',
                    stock: '',
                    unidad_de_medida: 'kg',
                    imagen_url: '',
                    categoria: '',
                    disponible: true,
                    puntos_canje: '', // Resetear también
                });
                setTimeout(() => {
                    navigate('/products');
                }, 1500); 
            } else {
                setError(response.data.error || 'Error desconocido al añadir el producto.');
            }
        } catch (err) {
            console.error('Error al añadir producto:', err);
            if (err.response) {
                setError(err.response.data.error || 'Error al añadir el producto (respuesta del servidor).');
            } else if (err.request) {
                setError('No se pudo conectar con el servidor. Intenta de nuevo más tarde.');
            } else {
                setError('Ocurrió un error inesperado al procesar la solicitud.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingAuth || !isAuthenticated || (user && user.role !== 'admin')) {
        return (
            <Container className="my-5 text-center">
                <h2 className="mb-3">Acceso Denegado</h2>
                <p className="text-muted">No tienes permiso para acceder a esta página.</p>
                {loadingAuth && <Spinner animation="border" className="mt-3" />}
            </Container>
        );
    }

    return (
        <Container className="my-5 p-4 border rounded shadow-sm" style={{ maxWidth: '700px' }}>
            <h1 className="mb-4 text-center text-primary">Añadir Nuevo Producto</h1>
            <p className="text-center text-muted mb-4">Ingresa los detalles para un nuevo producto. Un producto debe tener Precio O Puntos de Canje, pero no ambos.</p>

            {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="nombre">
                    <Form.Label>Nombre del Producto</Form.Label>
                    <Form.Control
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Ej: Lomo de cerdo"
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="descripcion">
                    <Form.Label>Descripción</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        placeholder="Breve descripción del producto..."
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="precio">
                    <Form.Label>Precio (deja vacío si es por canje)</Form.Label>
                    <Form.Control
                        type="number"
                        name="precio"
                        value={formData.precio}
                        onChange={handleChange}
                        step="0.01"
                        placeholder="Ej: 15.75"
                        // Eliminamos 'required' aquí porque ahora es opcional si hay puntos_canje
                    />
                </Form.Group>

                {/* >>>>>>>>>>>>>>> NUEVO CAMPO: Puntos de Canje <<<<<<<<<<<<<<<< */}
                <Form.Group className="mb-3" controlId="puntos_canje">
                    <Form.Label>Puntos de Canje (deja vacío si es por venta)</Form.Label>
                    <Form.Control
                        type="number"
                        name="puntos_canje"
                        value={formData.puntos_canje}
                        onChange={handleChange}
                        min="0"
                        placeholder="Ej: 500"
                    />
                    <Form.Text className="text-muted">
                        Si este producto se canjea por puntos, ingresa el valor aquí y deja el precio vacío.
                    </Form.Text>
                </Form.Group>
                {/* >>>>>>>>>>>>>>> FIN NUEVO CAMPO <<<<<<<<<<<<<<<< */}

                <Form.Group className="mb-3" controlId="stock">
                    <Form.Label>Stock</Form.Label>
                    <Form.Control
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="Ej: 100 (unidades o kg)"
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="unidad_de_medida">
                    <Form.Label>Unidad de Medida</Form.Label>
                    <Form.Select
                        name="unidad_de_medida"
                        value={formData.unidad_de_medida}
                        onChange={handleChange}
                    >
                        <option value="kg">Kilogramo (kg)</option>
                        <option value="unidad">Unidad</option>
                        <option value="paquete">Paquete</option>
                        <option value="gramos">Gramos (gr)</option>
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3" controlId="imagen_url">
                    <Form.Label>URL de la Imagen</Form.Label>
                    <Form.Control
                        type="text"
                        name="imagen_url"
                        value={formData.imagen_url}
                        onChange={handleChange}
                        placeholder="Ej: http://ejemplo.com/imagen.jpg"
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="categoria">
                    <Form.Label>Categoría</Form.Label>
                    <Form.Control
                        type="text"
                        name="categoria"
                        value={formData.categoria}
                        onChange={handleChange}
                        placeholder="Ej: Carnes Rojas, Pollo, Embutidos"
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="disponible">
                    <Form.Check
                        type="checkbox"
                        name="disponible"
                        label="Producto Disponible para Venta"
                        checked={formData.disponible}
                        onChange={handleChange}
                    />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100 mt-3" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                            Añadiendo...
                        </>
                    ) : (
                        'Añadir Producto'
                    )}
                </Button>
            </Form>
        </Container>
    );
};

export default ProductAddPage;