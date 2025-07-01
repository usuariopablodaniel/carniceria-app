import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // useParams para obtener el ID de la URL
import { useAuth } from '../context/AuthContext';
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap';
import axios from '../api/axios'; // Importar la instancia de Axios configurada

const ProductEditPage = () => {
    const { id } = useParams(); // Obtiene el ID del producto de la URL
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
    });
    const [loadingProduct, setLoadingProduct] = useState(true); // Nuevo estado para cargar el producto
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // Estado para el botón de envío

    // useEffect para verificar el rol y redirigir, y para cargar el producto
    useEffect(() => {
        // No redirigir ni cargar si loadingAuth es true
        if (loadingAuth) {
            return; 
        }

        // Si el usuario NO está autenticado
        if (!isAuthenticated) {
            navigate('/login', { replace: true });
            return;
        }

        // Si el usuario está autenticado, pero NO tiene el rol de 'admin'
        if (user && user.role !== 'admin') {
            navigate('/dashboard', { replace: true });
            return; // Detener la ejecución del efecto
        }

        // Si es admin y autenticado, intentar cargar el producto
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`/products/${id}`); // Petición GET al backend por ID
                const productData = response.data; // Axios pone la data directamente en .data
                setFormData({
                    nombre: productData.nombre || '',
                    descripcion: productData.descripcion || '',
                    // Asegúrate de que precio y stock sean números para los inputs
                    precio: productData.precio !== undefined ? String(productData.precio) : '',
                    stock: productData.stock !== undefined ? String(productData.stock) : '',
                    unidad_de_medida: productData.unidad_de_medida || 'kg',
                    imagen_url: productData.imagen_url || '',
                    categoria: productData.categoria || '',
                    disponible: productData.disponible !== undefined ? productData.disponible : true,
                });
            } catch (err) {
                console.error('Error al cargar el producto para edición:', err);
                setError('No se pudo cargar el producto para edición. Verifica el ID.');
            } finally {
                setLoadingProduct(false); // La carga del producto ha terminado
            }
        };

        fetchProduct();
    }, [id, user, navigate, isAuthenticated, loadingAuth]); // Dependencias: id, user, navigate, isAuthenticated, loadingAuth

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

        // Validaciones Frontend (similares a ProductAddPage)
        if (!formData.nombre || !formData.precio || !formData.stock) {
            setError('Nombre, Precio y Stock son obligatorios.');
            setIsSubmitting(false);
            return;
        }
        if (isNaN(parseFloat(formData.precio)) || parseFloat(formData.precio) <= 0) {
            setError('El precio debe ser un número positivo.');
            setIsSubmitting(false);
            return;
        }
        if (isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
            setError('El stock debe ser un número no negativo.');
            setIsSubmitting(false);
            return;
        }

        try {
            const productDataToUpdate = {
                ...formData,
                precio: parseFloat(formData.precio),
                stock: parseInt(formData.stock),
            };

            const response = await axios.put(`/products/${id}`, productDataToUpdate); // Petición PUT al backend

            if (response.status === 200) { // 200 OK es el código esperado para un PUT exitoso
                setMessage('Producto actualizado exitosamente!');
                // No limpiamos el formulario, ya que estamos editando un producto existente.
                // Redirigir al usuario a la lista de productos después de un breve retardo.
                setTimeout(() => {
                    navigate('/products');
                }, 1500); 
            } else {
                setError(response.data.error || 'Error desconocido al actualizar el producto.');
            }
        } catch (err) {
            console.error('Error al actualizar producto:', err);
            if (err.response) {
                setError(err.response.data.error || 'Error al actualizar el producto (respuesta del servidor).');
            } else if (err.request) {
                setError('No se pudo conectar con el servidor. Intenta de nuevo más tarde.');
            } else {
                setError('Ocurrió un error inesperado al procesar la solicitud.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Renderizado condicional para estados de carga y acceso
    if (loadingAuth || loadingProduct || !isAuthenticated || (user && user.role !== 'admin')) {
        let content;
        if (loadingAuth || loadingProduct) {
            content = (
                <>
                    <Spinner animation="border" className="mt-3" />
                    <p className="mt-2">Cargando información del producto y usuario...</p>
                </>
            );
        } else {
            content = (
                <>
                    <h2 className="mb-3">Acceso Denegado</h2>
                    <p className="text-muted">No tienes permiso para acceder a esta página.</p>
                </>
            );
        }
        return (
            <Container className="my-5 text-center">
                {content}
            </Container>
        );
    }

    // Si todo está bien, renderizar el formulario de edición
    return (
        <Container className="my-5 p-4 border rounded shadow-sm" style={{ maxWidth: '700px' }}>
            <h1 className="mb-4 text-center text-primary">Editar Producto</h1>
            <p className="text-center text-muted mb-4">Modifica los detalles del producto.</p>

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
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="precio">
                    <Form.Label>Precio</Form.Label>
                    <Form.Control
                        type="number"
                        name="precio"
                        value={formData.precio}
                        onChange={handleChange}
                        step="0.01"
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="stock">
                    <Form.Label>Stock</Form.Label>
                    <Form.Control
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
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
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="categoria">
                    <Form.Label>Categoría</Form.Label>
                    <Form.Control
                        type="text"
                        name="categoria"
                        value={formData.categoria}
                        onChange={handleChange}
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
                            Guardando cambios...
                        </>
                    ) : (
                        'Guardar Cambios'
                    )}
                </Button>
            </Form>
        </Container>
    );
};

export default ProductEditPage;