import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap';
import axios from '../api/axios';

const ProductEditPage = () => {
    const { id } = useParams();
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
        puntos_canje: '',
    });
    const [imageFile, setImageFile] = useState(null); 
    const [imagePreviewUrl, setImagePreviewUrl] = useState(''); 

    const [loadingProduct, setLoadingProduct] = useState(true);
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
            return; 
        }

        const fetchProduct = async () => {
            try {
                // Validación: Si el ID no es válido (ej. undefined, null, NaN), muestra un error.
                if (!id || isNaN(Number(id))) { 
                    setError('ID de producto no válido o no proporcionado para edición.');
                    setLoadingProduct(false);
                    return; 
                }

                const requestUrl = `/products/${id}`;
                const response = await axios.get(requestUrl);
                const productData = response.data;
                setFormData({
                    nombre: productData.nombre || '',
                    descripcion: productData.descripcion || '',
                    precio: productData.precio !== undefined && productData.precio !== null ? String(productData.precio) : '',
                    stock: productData.stock !== undefined && productData.stock !== null ? String(productData.stock) : '',
                    unidad_de_medida: productData.unidad_de_medida || 'kg',
                    imagen_url: productData.imagen_url || '',
                    categoria: productData.categoria || '',
                    disponible: productData.disponible !== undefined ? productData.disponible : true,
                    puntos_canje: productData.puntos_canje !== undefined && productData.puntos_canje !== null ? String(productData.puntos_canje) : '',
                });
                // Construir la URL completa para la previsualización de la imagen existente
                if (productData.imagen_url) {
                    const backendBaseUrl = axios.defaults.baseURL.replace('/api', '');
                    setImagePreviewUrl(`${backendBaseUrl}${productData.imagen_url}`);
                }
            } catch (err) {
                console.error('Error al cargar el producto para edición:', err);
                if (err.response) {
                    setError(err.response.data.error || `Error al cargar el producto (Código: ${err.response.status}).`);
                } else if (err.request) {
                    setError('No se pudo conectar con el servidor. Verifica tu conexión.');
                } else {
                    setError('Ocurrió un error inesperado al procesar la solicitud.');
                }
            } finally {
                setLoadingProduct(false);
            }
        };

        fetchProduct();

        return () => {
            if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };

    }, [id, user, navigate, isAuthenticated, loadingAuth, imagePreviewUrl]);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'file') {
            const file = files[0];
            setImageFile(file);
            if (file) {
                if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(imagePreviewUrl);
                }
                setImagePreviewUrl(URL.createObjectURL(file));
            } else {
                if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(imagePreviewUrl);
                }
                if (formData.imagen_url) {
                    const backendBaseUrl = axios.defaults.baseURL.replace('/api', '');
                    setImagePreviewUrl(`${backendBaseUrl}${formData.imagen_url}`);
                } else {
                    setImagePreviewUrl('');
                }
            }
        } else {
            setFormData(prevData => {
                const newData = {
                    ...prevData,
                    [name]: type === 'checkbox' ? checked : value,
                };

                if (name === 'precio' && value !== '' && newData.puntos_canje !== '') {
                    newData.puntos_canje = '';
                } else if (name === 'puntos_canje' && value !== '' && newData.precio !== '') {
                    newData.precio = '';
                }
                return newData;
            });
        }
    };

    const handleRemoveCurrentImage = () => {
        setFormData(prevData => ({
            ...prevData,
            imagen_url: '' 
        }));
        setImageFile(null);
        setImagePreviewUrl('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSubmitting(true);

        if (!formData.nombre || formData.stock === '') {
            setError('Nombre y Stock son obligatorios.');
            setIsSubmitting(false);
            return;
        }

        const hasPriceInput = formData.precio !== '' && formData.precio !== null;
        const hasPointsInput = formData.puntos_canje !== '' && formData.puntos_canje !== null;

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

        if (hasPriceInput) {
            const parsedPrice = parseFloat(formData.precio);
            if (isNaN(parsedPrice) || parsedPrice <= 0) {
                setError('El precio debe ser un número positivo.');
                setIsSubmitting(false);
                return;
            }
        }

        if (hasPointsInput) {
            const parsedPoints = parseInt(formData.puntos_canje);
            if (isNaN(parsedPoints) || parsedPoints < 0) { 
                setError('Los puntos de canje deben ser un número no negativo.');
                setIsSubmitting(false);
                return;
            }
        }

        const parsedStock = parseInt(formData.stock);
        if (isNaN(parsedStock) || parsedStock < 0) {
            setError('El stock debe ser un número no negativo.');
            setIsSubmitting(false);
            return;
        }

        const dataToSend = new FormData();
        for (const key in formData) {
            if (['precio', 'puntos_canje', 'stock', 'disponible', 'imagen_url'].includes(key)) {
                continue; 
            }
            dataToSend.append(key, formData[key]);
        }

        dataToSend.append('precio', hasPriceInput ? parseFloat(formData.precio) : ''); 
        dataToSend.append('puntos_canje', hasPointsInput ? parseInt(formData.puntos_canje) : '');
        dataToSend.append('stock', parsedStock);
        dataToSend.append('disponible', formData.disponible ? 'true' : 'false');

        if (imageFile) {
            dataToSend.append('imagen', imageFile); 
        } else if (formData.imagen_url === '') {
            dataToSend.append('imagen_url_clear', 'true'); 
        }

        try {
            const response = await axios.put(`/products/${id}`, dataToSend);
            
            if (response.status === 200) {
                setMessage('Producto actualizado exitosamente!');
                setImageFile(null);
                if (response.data.product && response.data.product.imagen_url !== undefined) {
                    const backendBaseUrl = axios.defaults.baseURL.replace('/api', '');
                    const newFullImageUrl = `${backendBaseUrl}${response.data.product.imagen_url}`;
                    setFormData(prevData => ({ ...prevData, imagen_url: response.data.product.imagen_url }));
                    setImagePreviewUrl(newFullImageUrl || '');
                } else {
                    setFormData(prevData => ({ ...prevData, imagen_url: '' }));
                    setImagePreviewUrl('');
                }
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

    return (
        <Container className="my-5 p-4 border rounded shadow-sm" style={{ maxWidth: '700px' }}>
            <h1 className="mb-4 text-center text-primary">Editar Producto</h1>
            <p className="text-center text-muted mb-4">Modifica los detalles del producto.</p>

            {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            <Form onSubmit={handleSubmit} encType="multipart/form-data"> 
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
                    <Form.Label>Precio (deja vacío si es por canje)</Form.Label>
                    <Form.Control
                        type="number"
                        name="precio"
                        value={formData.precio}
                        onChange={handleChange}
                        step="0.01"
                    />
                </Form.Group>
                
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

                <Form.Group className="mb-3" controlId="imagen">
                    <Form.Label>Imagen del Producto</Form.Label>
                    <Form.Control
                        type="file"
                        name="imagen"
                        onChange={handleChange}
                        accept="image/*"
                    />
                    {/* Previsualización de la imagen nueva o existente */}
                    {imagePreviewUrl && (
                        <div className="mt-2 text-center">
                            <p className="text-muted mb-1">Previsualización:</p>
                            <img 
                                src={imagePreviewUrl} 
                                alt="Previsualización del producto" 
                                style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '4px' }} 
                            />
                            {imageFile && <Form.Text className="text-muted d-block mt-1">Archivo seleccionado: {imageFile.name}</Form.Text>}
                            {!imageFile && formData.imagen_url && (
                                <Form.Text className="text-muted d-block mt-1">Imagen actual (no se ha subido una nueva)</Form.Text>
                            )}
                            {(formData.imagen_url || imageFile) && (
                                <Button 
                                    variant="outline-danger" 
                                    size="sm" 
                                    className="mt-2" 
                                    onClick={handleRemoveCurrentImage}
                                >
                                    Eliminar Imagen Actual
                                </Button>
                            )}
                        </div>
                    )}
                    {!imagePreviewUrl && formData.imagen_url === '' && imageFile === null && (
                        <Form.Text className="text-muted d-block mt-1">
                            No hay imagen seleccionada ni imagen actual.
                        </Form.Text>
                    )}
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