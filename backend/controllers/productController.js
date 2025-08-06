// backend/controllers/productController.js

const pool = require('../db'); 
const path = require('path');
const fs = require('fs/promises'); 

// >>>>>>>>>>>>>>> RUTA DE UPLOADS: Asegúrate de que esta ruta coincida con server.js y productRoutes.js <<<<<<<<<<<<<<<<
const UPLOADS_BASE_PATH = path.join('C:', 'temp', 'uploads'); 
const IMAGES_UPLOAD_PATH = path.join(UPLOADS_BASE_PATH, 'imagenes');
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

// >>>>>>>>>>>>>>> FUNCIÓN AUXILIAR GLOBAL PARA ELIMINAR ARCHIVOS SUBIDOS <<<<<<<<<<<<<<<<
// Esta función ahora está definida fuera de cualquier controlador para ser accesible globalmente.
const cleanUploadedFileOnError = async (file) => {
    if (file) {
        const filePath = path.join(IMAGES_UPLOAD_PATH, file.filename);
        // console.log(`DEBUG: Intentando eliminar archivo ${file.filename} debido a error.`); // Eliminado
        await fs.unlink(filePath).catch(err => console.error("Error al eliminar imagen subida:", err));
    }
};
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

// @desc    Obtener todos los productos
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY nombre ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener productos:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener productos.' });
    }
};

// @desc    Obtener un producto por ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener producto por ID:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener el producto.' });
    }
};

// @desc    Añadir un nuevo producto
// @route   POST /api/products
// @access  Private (Admin)
exports.addProduct = async (req, res) => {
    const { nombre, descripcion, precio, stock, unidad_de_medida, categoria, disponible, puntos_canje } = req.body;
    let imagen_url = null; 

    // console.log('ADD PRODUCT DEBUG: Iniciando addProduct. req.file:', req.file); // Eliminado
    // console.log('ADD PRODUCT DEBUG: req.body:', req.body); // Eliminado

    if (req.file) {
        imagen_url = `/api/images/${req.file.filename}`; 
        // console.log('ADD PRODUCT DEBUG: imagen_url generada:', imagen_url); // Eliminado
    } else {
        // console.log('ADD PRODUCT DEBUG: No se subió ningún archivo de imagen.'); // Eliminado
    }

    const finalPrecio = (precio === undefined || precio === null || precio === '') ? null : parseFloat(precio);
    const finalPuntosCanje = (puntos_canje === undefined || puntos_canje === null || puntos_canje === '') ? null : parseInt(puntos_canje);

    const handleValidationError = async () => {
        if (req.file) {
            await cleanUploadedFileOnError(req.file);
        }
    };

    if (!nombre || nombre.trim() === '') {
        await handleValidationError();
        return res.status(400).json({ error: 'El nombre del producto es obligatorio.' });
    }
    if (stock === undefined || stock === null || stock === '') {
        await handleValidationError();
        return res.status(400).json({ error: 'El stock es obligatorio.' });
    }

    const hasPriceInput = finalPrecio !== null;
    const hasPointsInput = finalPuntosCanje !== null;

    if (!hasPriceInput && !hasPointsInput) {
        await handleValidationError();
        return res.status(400).json({ error: 'Debe ingresar un Precio o Puntos de Canje para el producto.' });
    }
    if (hasPriceInput && hasPointsInput) {
        await handleValidationError();
        return res.status(400).json({ error: 'No puede ingresar Precio y Puntos de Canje a la vez. Elija uno.' });
    }

    if (hasPriceInput) {
        if (isNaN(finalPrecio) || finalPrecio <= 0) {
            await handleValidationError();
            return res.status(400).json({ error: 'El precio debe ser un número positivo.' });
        }
    }

    if (hasPointsInput) {
        if (isNaN(finalPuntosCanje) || finalPuntosCanje < 0) {
            await handleValidationError();
            return res.status(400).json({ error: 'Los puntos de canje deben ser un número no negativo.' });
        }
    }

    const parsedStock = parseInt(stock);
    if (isNaN(parsedStock) || parsedStock < 0) {
        await handleValidationError();
        return res.status(400).json({ error: 'El stock debe ser un número no negativo.' });
    }

    try {
        // console.log('ADD PRODUCT DEBUG: Intentando insertar en DB con imagen_url:', imagen_url); // Eliminado
        const result = await pool.query(
            `INSERT INTO productos (nombre, descripcion, precio, stock, unidad_de_medida, imagen_url, categoria, disponible, puntos_canje)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
                nombre,
                descripcion,
                finalPrecio, 
                parsedStock, 
                unidad_de_medida,
                imagen_url, 
                categoria,
                disponible,
                finalPuntosCanje 
            ]
        );
        // console.log('ADD PRODUCT DEBUG: Producto insertado en DB. Resultado:', result.rows[0]); // Eliminado
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('ADD PRODUCT ERROR: Error al añadir producto en DB:', err.message);
        await cleanUploadedFileOnError(req.file); 
        
        if (err.code === '23502') { 
             res.status(400).json({ error: 'Faltan campos obligatorios o hay un problema de formato en la base de datos.' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor al añadir el producto.' });
        }
    }
};

// @desc    Actualizar un producto existente
// @route   PUT /api/products/:id
// @access  Private (Admin)
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, unidad_de_medida, categoria, disponible, puntos_canje, imagen_url_clear } = req.body; 
    let new_imagen_url = null; 

    // console.log('UPDATE PRODUCT DEBUG: INICIO DE updateProduct. req.file (desde Multer):', req.file); // Eliminado
    // console.log('UPDATE PRODUCT DEBUG: req.body (desde Multer):', req.body); // Eliminado
    // console.log('UPDATE PRODUCT DEBUG: req.body.imagen_url_clear (desde Frontend):', imagen_url_clear); // Eliminado

    const finalPrecio = (precio === undefined || precio === null || precio === '') ? null : parseFloat(precio);
    const finalPuntosCanje = (puntos_canje === undefined || puntos_canje === null || puntos_canje === '') ? null : parseInt(puntos_canje);

    const hasPriceInput = finalPrecio !== null;
    const hasPointsInput = finalPuntosCanje !== null;

    const handleValidationError = async () => {
        if (req.file) {
            await cleanUploadedFileOnError(req.file);
        }
    };

    if (hasPriceInput && hasPointsInput) {
        await handleValidationError();
        return res.status(400).json({ error: 'No puede actualizar Precio y Puntos de Canje a la vez. Elija uno.' });
    }
    if (hasPriceInput) {
        if (isNaN(finalPrecio) || finalPrecio <= 0) {
            await handleValidationError();
            return res.status(400).json({ error: 'El precio debe ser un número positivo.' });
        }
    }
    if (hasPointsInput) {
        if (isNaN(finalPuntosCanje) || finalPuntosCanje < 0) {
            await handleValidationError();
            return res.status(400).json({ error: 'Los puntos de canje deben ser un número no negativo.' });
        }
    }
    const parsedStock = (stock !== undefined && stock !== null && stock !== '') ? parseInt(stock) : undefined;
    if (stock !== undefined && (isNaN(parsedStock) || parsedStock < 0)) {
        await handleValidationError();
        return res.status(400).json({ error: 'El stock debe ser un número no negativo.' });
    }

    try {
        // console.log('UPDATE PRODUCT DEBUG: Buscando imagen_url actual para producto ID:', id); // Eliminado
        const productResult = await pool.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
        if (productResult.rows.length === 0) {
            await handleValidationError(); 
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }
        const currentImageUrl = productResult.rows[0].imagen_url; 

        // console.log('UPDATE PRODUCT DEBUG: currentImageUrl desde DB (producto existente):', currentImageUrl); // Eliminado
        
        if (req.file) { 
            new_imagen_url = `/api/images/${req.file.filename}`; 
            // console.log('UPDATE PRODUCT DEBUG: Nueva imagen subida detectada. new_imagen_url:', new_imagen_url); // Eliminado
            if (currentImageUrl && currentImageUrl.startsWith('/api/images/')) {
                const oldImagePath = path.join(IMAGES_UPLOAD_PATH, path.basename(currentImageUrl)); 
                // console.log('UPDATE PRODUCT DEBUG: Intentando eliminar imagen antigua:', oldImagePath); // Eliminado
                fs.unlink(oldImagePath).catch(err => console.error("Error al eliminar imagen antigua (update):", err));
            }
        } else if (imagen_url_clear === 'true') { 
            new_imagen_url = null; 
            // console.log('UPDATE PRODUCT DEBUG: Solicitud para limpiar imagen detectada. new_imagen_url:', new_imagen_url); // Eliminado
            if (currentImageUrl && currentImageUrl.startsWith('/api/images/')) {
                const oldImagePath = path.join(IMAGES_UPLOAD_PATH, path.basename(currentImageUrl));
                // console.log('UPDATE PRODUCT DEBUG: Intentando eliminar imagen por solicitud del cliente:', oldImagePath); // Eliminado
                fs.unlink(oldImagePath).catch(err => console.error("Error al eliminar imagen por solicitud del cliente (update):", err));
            }
        } else { 
            new_imagen_url = currentImageUrl;
            // console.log('UPDATE PRODUCT DEBUG: No hay nueva imagen ni solicitud de limpieza. Manteniendo imagen actual:', new_imagen_url); // Eliminado
        }

        // console.log('UPDATE PRODUCT DEBUG: Valor FINAL de new_imagen_url antes de la consulta a la DB:', new_imagen_url); // Eliminado

        const fields = [];
        const values = [];
        let queryIndex = 1;

        if (nombre !== undefined) { fields.push(`nombre = $${queryIndex++}`); values.push(nombre); }
        if (descripcion !== undefined) { fields.push(`descripcion = $${queryIndex++}`); values.push(descripcion); }
        
        if (hasPriceInput) {
            fields.push(`precio = $${queryIndex++}`); values.push(finalPrecio);
            fields.push(`puntos_canje = $${queryIndex++}`); values.push(null); 
        } else if (hasPointsInput) {
            fields.push(`puntos_canje = $${queryIndex++}`); values.push(finalPuntosCanje);
            fields.push(`precio = $${queryIndex++}`); values.push(null); 
        }

        if (stock !== undefined && parsedStock !== undefined) { fields.push(`stock = $${queryIndex++}`); values.push(parsedStock); }
        
        fields.push(`imagen_url = $${queryIndex++}`); values.push(new_imagen_url); 
        
        if (unidad_de_medida !== undefined) { fields.push(`unidad_de_medida = $${queryIndex++}`); values.push(unidad_de_medida); }
        if (categoria !== undefined) { fields.push(`categoria = $${queryIndex++}`); values.push(categoria); }
        if (disponible !== undefined) { fields.push(`disponible = $${queryIndex++}`); values.push(disponible); }

        if (fields.length === 0) {
            await handleValidationError();
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
        }

        values.push(id); 
        const updateQuery = `UPDATE productos SET ${fields.join(', ')} WHERE id = $${queryIndex} RETURNING *`;

        // console.log('UPDATE PRODUCT DEBUG: Ejecutando UPDATE en DB. Query:', updateQuery, 'Values:', values); // Eliminado
        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            await handleValidationError(); 
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }
        // console.log('UPDATE PRODUCT DEBUG: Producto actualizado en DB. Resultado:', result.rows[0]); // Eliminado
        res.status(200).json({ product: result.rows[0], message: 'Producto actualizado exitosamente.' });
    } catch (err) {
        console.error('UPDATE PRODUCT ERROR: Error al actualizar producto en DB:', err); 
        await cleanUploadedFileOnError(req.file); 
        res.status(500).json({ error: 'Error interno del servidor al actualizar el producto.' });
    }
};

// @desc    Eliminar un producto
// @route   DELETE /api/products/:id
// @access  Private (Admin)
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    // console.log('DELETE PRODUCT DEBUG: Iniciando deleteProduct para ID:', id); // Eliminado

    let client; 
    try {
        client = await pool.connect(); 
        await client.query('BEGIN'); 

        // console.log('DELETE PRODUCT DEBUG: Buscando imagen_url para eliminar producto ID:', id); // Eliminado
        const productResult = await client.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
        const imageUrlToDelete = productResult.rows[0] ? productResult.rows[0].imagen_url : null;
        // console.log('DELETE PRODUCT DEBUG: imageUrlToDelete:', imageUrlToDelete); // Eliminado

        // >>>>>>>>>>>>>>> CORRECCIÓN: Usar 'premio_canjeado_id' <<<<<<<<<<<<<<<<
        // console.log(`DELETE PRODUCT DEBUG: Intentando eliminar transacciones_puntos relacionadas con producto ID: ${id}`); // Eliminado
        await client.query('DELETE FROM transacciones_puntos WHERE premio_canjeado_id = $1', [id]);
        // console.log(`DELETE PRODUCT DEBUG: Transacciones_puntos relacionadas eliminadas para producto ID: ${id}`); // Eliminado
        // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

        // console.log('DELETE PRODUCT DEBUG: Intentando eliminar producto de DB ID:', id); // Eliminado
        const result = await client.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            // console.log('DELETE PRODUCT DEBUG: Producto no encontrado para eliminar ID:', id); // Eliminado
            await client.query('ROLLBACK'); 
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }
        // console.log('DELETE PRODUCT DEBUG: Producto eliminado de DB. Resultado:', result.rows[0]); // Eliminado

        if (imageUrlToDelete && imageUrlToDelete.startsWith('/api/images/')) {
            const imageFilename = path.basename(imageUrlToDelete); 
            const imagePath = path.join(IMAGES_UPLOAD_PATH, imageFilename);
            // console.log('DELETE PRODUCT DEBUG: Intentando eliminar archivo de imagen físico:', imagePath); // Eliminado
            fs.unlink(imagePath).catch(err => console.error("Error al eliminar archivo de imagen (delete):", err)); 
        }

        await client.query('COMMIT'); 
        res.status(200).json({ message: 'Producto eliminado exitosamente.' });
    } catch (err) {
        console.error('DELETE PRODUCT ERROR: Error al eliminar producto en DB:', err); 
        if (client) {
            await client.query('ROLLBACK'); 
            // console.log('DELETE PRODUCT ERROR: Transacción revertida.'); // Eliminado
        }
        res.status(500).json({ error: 'Error interno del servidor al eliminar el producto.' });
    } finally {
        if (client) {
            client.release(); 
        }
    }
};