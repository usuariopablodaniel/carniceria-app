// backend/controllers/productController.js

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs/promises');

// Define la ruta base de la carpeta de uploads de forma absoluta
const UPLOADS_BASE_PATH = path.join('C:', 'Users', 'pablo', 'Pictures', 'uploads');
const IMAGES_UPLOAD_PATH = path.join(UPLOADS_BASE_PATH, 'imagenes');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

exports.getProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY nombre ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener productos:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener productos.' });
    }
};

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

exports.addProduct = async (req, res) => {
    const { nombre, descripcion, precio, stock, unidad_de_medida, categoria, disponible, puntos_canje } = req.body;
    let imagen_url = null;

    console.log('ADD PRODUCT DEBUG: Iniciando addProduct. req.file:', req.file); 

    if (req.file) {
        imagen_url = `/api/images/${req.file.filename}`; 
        console.log('ADD PRODUCT DEBUG: imagen_url generada:', imagen_url); 
    } else {
        console.log('ADD PRODUCT DEBUG: No se subió ningún archivo de imagen.'); 
    }

    const finalPrecio = (precio === undefined || precio === null || precio === '') ? null : parseFloat(precio);
    const finalPuntosCanje = (puntos_canje === undefined || puntos_canje === null || puntos_canje === '') ? null : parseInt(puntos_canje);

    if (!nombre || nombre.trim() === '') {
        if (req.file) {
            console.log('ADD PRODUCT DEBUG: Nombre vacío, intentando eliminar archivo:', req.file.filename); 
            await fs.unlink(path.join(IMAGES_UPLOAD_PATH, req.file.filename)).catch(err => console.error("Error al eliminar imagen subida por validación (nombre):", err));
        }
        return res.status(400).json({ error: 'El nombre del producto es obligatorio.' });
    }
    if (stock === undefined || stock === null || stock === '') {
        if (req.file) {
            console.log('ADD PRODUCT DEBUG: Stock vacío, intentando eliminar archivo:', req.file.filename); 
            await fs.unlink(path.join(IMAGES_UPLOAD_PATH, req.file.filename)).catch(err => console.error("Error al eliminar imagen subida por validación (stock):", err));
        }
        return res.status(400).json({ error: 'El stock es obligatorio.' });
    }

    const hasPriceInput = finalPrecio !== null;
    const hasPointsInput = finalPuntosCanje !== null;

    if (!hasPriceInput && !hasPointsInput) {
        if (req.file) {
            console.log('ADD PRODUCT DEBUG: Precio/Puntos vacíos, intentando eliminar archivo:', req.file.filename); 
            await fs.unlink(path.join(IMAGES_UPLOAD_PATH, req.file.filename)).catch(err => console.error("Error al eliminar imagen subida por validación (precio/puntos):", err));
        }
        return res.status(400).json({ error: 'Debe ingresar un Precio o Puntos de Canje para el producto.' });
    }
    if (hasPriceInput && hasPointsInput) {
        if (req.file) {
            console.log('ADD PRODUCT DEBUG: Ambos precio/puntos, intentando eliminar archivo:', req.file.filename); 
            await fs.unlink(path.join(IMAGES_UPLOAD_PATH, req.file.filename)).catch(err => console.error("Error al eliminar imagen subida por validación (ambos):", err));
        }
        return res.status(400).json({ error: 'No puede ingresar Precio y Puntos de Canje a la vez. Elija uno.' });
    }

    if (hasPriceInput) {
        if (isNaN(finalPrecio) || finalPrecio <= 0) {
            if (req.file) {
                console.log('ADD PRODUCT DEBUG: Precio inválido, intentando eliminar archivo:', req.file.filename); 
                await fs.unlink(path.join(IMAGES_UPLOAD_PATH, req.file.filename)).catch(err => console.error("Error al eliminar imagen subida por validación (precio inválido):", err));
            }
            return res.status(400).json({ error: 'El precio debe ser un número positivo.' });
        }
    }

    if (hasPointsInput) {
        if (isNaN(finalPuntosCanje) || finalPuntosCanje < 0) {
            if (req.file) {
                console.log('ADD PRODUCT DEBUG: Puntos inválidos, intentando eliminar archivo:', req.file.filename); 
                await fs.unlink(path.join(IMAGES_UPLOAD_PATH, req.file.filename)).catch(err => console.error("Error al eliminar imagen subida por validación (puntos inválidos):", err));
            }
            return res.status(400).json({ error: 'Los puntos de canje deben ser un número no negativo.' });
        }
    }

    if (isNaN(parseInt(stock)) || parseInt(stock) < 0) {
        if (req.file) {
            console.log('ADD PRODUCT DEBUG: Stock inválido, intentando eliminar archivo:', req.file.filename); 
            await fs.unlink(path.join(IMAGES_UPLOAD_PATH, req.file.filename)).catch(err => console.error("Error al eliminar imagen subida por validación (stock inválido):", err));
        }
        return res.status(400).json({ error: 'El stock debe ser un número no negativo.' });
    }

    try {
        console.log('ADD PRODUCT DEBUG: Intentando insertar en DB con imagen_url:', imagen_url); 
        const result = await pool.query(
            `INSERT INTO productos (nombre, descripcion, precio, stock, unidad_de_medida, imagen_url, categoria, disponible, puntos_canje)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
                nombre,
                descripcion,
                finalPrecio,
                parseInt(stock),
                unidad_de_medida,
                imagen_url,
                categoria,
                disponible,
                finalPuntosCanje
            ]
        );
        console.log('ADD PRODUCT DEBUG: Producto insertado en DB. Resultado:', result.rows[0]); 
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('ADD PRODUCT ERROR: Error al añadir producto en DB:', err.message);
        if (req.file) {
            console.log('ADD PRODUCT DEBUG: Intentando eliminar archivo por fallo de DB:', req.file.filename); 
            await fs.unlink(path.join(IMAGES_UPLOAD_PATH, req.file.filename)).catch(unlinkErr => console.error("Error al eliminar imagen subida por fallo de DB:", unlinkErr));
        }
        if (err.code === '23502') {
             res.status(400).json({ error: 'Faltan campos obligatorios o hay un problema de formato en la base de datos.' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor al añadir el producto.' });
        }
    }
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, unidad_de_medida, categoria, disponible, puntos_canje } = req.body;
    let new_imagen_url = null;

    console.log('UPDATE PRODUCT DEBUG: Iniciando updateProduct. req.file:', req.file); // Depuración: Verifica si Multer procesó el archivo
    console.log('UPDATE PRODUCT DEBUG: req.body:', req.body); // Depuración: Verifica los datos del formulario

    const finalPrecio = (precio === undefined || precio === null || precio === '') ? null : parseFloat(precio);
    const finalPuntosCanje = (puntos_canje === undefined || puntos_canje === null || puntos_canje === '') ? null : parseInt(puntos_canje);

    const hasPriceInput = finalPrecio !== null;
    const hasPointsInput = finalPuntosCanje !== null;

    if (hasPriceInput && hasPointsInput) {
        if (req.file) {
            console.log('UPDATE PRODUCT DEBUG: Ambos precio/puntos, intentando eliminar archivo:', req.file.filename); 
            await fs.unlink(path.join(IMAGES_UPLOAD_PATH, req.file.filename)).catch(err => console.error("Error al eliminar imagen subida por validación (ambos):", err));
        }
        return res.status(400).json({ error: 'No puede actualizar Precio y Puntos de Canje a la vez. Elija uno.' });
    }
    if (hasPriceInput) {
        if (isNaN(finalPrecio) || finalPrecio <= 0) {
            if (req.file) {
                console.log('UPDATE PRODUCT DEBUG: Precio inválido, intentando eliminar archivo:', req.file.filename); 
                await fs.unlink(path.join(IMAGES_UPLOAD_PATH, req.file.filename)).catch(err => console.error("Error al eliminar imagen subida por validación (precio inválido):", err));
            }
            return res.status(400).json({ error: 'El precio debe ser un número positivo.' });
        }
    }
    if (hasPointsInput) {
        if (isNaN(finalPuntosCanje) || finalPuntosCanje < 0) {
            if (req.file) {
                console.log('UPDATE PRODUCT DEBUG: Puntos inválidos, intentando eliminar archivo:', req.file.filename); 
                await fs.unlink(path.join(IMAGES_UPLOAD_PATH, req.file.filename)).catch(err => console.error("Error al eliminar imagen subida por validación (puntos inválidos):", err));
            }
            return res.status(400).json({ error: 'Los puntos de canje deben ser un número no negativo.' });
        }
    }
    if (stock !== undefined && (isNaN(parseInt(stock)) || parseInt(stock) < 0)) {
        if (req.file) {
            console.log('UPDATE PRODUCT DEBUG: Stock inválido, intentando eliminar archivo:', req.file.filename); 
            await fs.unlink(path.join(IMAGES_UPLOAD_PATH, req.file.filename)).catch(err => console.error("Error al eliminar imagen subida por validación (stock inválido):", err));
        }
        return res.status(400).json({ error: 'El stock debe ser un número no negativo.' });
    }

    try {
        console.log('UPDATE PRODUCT DEBUG: Buscando imagen_url actual para producto ID:', id); 
        const productResult = await pool.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
        const currentImageUrl = productResult.rows[0] ? productResult.rows[0].imagen_url : null;
        console.log('UPDATE PRODUCT DEBUG: currentImageUrl desde DB:', currentImageUrl); 
        
        if (req.file) { // Si se subió un nuevo archivo de imagen
            new_imagen_url = `/api/images/${req.file.filename}`; 
            console.log('UPDATE PRODUCT DEBUG: Nueva imagen subida. new_imagen_url:', new_imagen_url); 
            if (currentImageUrl && currentImageUrl.startsWith('/api/images/')) {
                const oldImagePath = path.join(IMAGES_UPLOAD_PATH, currentImageUrl.replace('/api/images/', ''));
                console.log('UPDATE PRODUCT DEBUG: Intentando eliminar imagen antigua:', oldImagePath); 
                await fs.unlink(oldImagePath).catch(err => console.error("Error al eliminar imagen antigua (update):", err));
            }
        } else if (req.body.imagen_url_clear === 'true') { // Si se marcó la opción de limpiar imagen
            new_imagen_url = null;
            console.log('UPDATE PRODUCT DEBUG: Solicitud para limpiar imagen. new_imagen_url:', new_imagen_url); 
            if (currentImageUrl && currentImageUrl.startsWith('/api/images/')) {
                const oldImagePath = path.join(IMAGES_UPLOAD_PATH, currentImageUrl.replace('/api/images/', ''));
                console.log('UPDATE PRODUCT DEBUG: Intentando eliminar imagen por solicitud del cliente:', oldImagePath); 
                await fs.unlink(oldImagePath).catch(err => console.error("Error al eliminar imagen por solicitud del cliente (update):", err));
            }
        } else { // Si no se subió nueva imagen ni se marcó para limpiar
            new_imagen_url = currentImageUrl;
            console.log('UPDATE PRODUCT DEBUG: No hay nueva imagen ni solicitud de limpieza. Manteniendo imagen actual:', new_imagen_url); 
        }

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

        if (stock !== undefined) { fields.push(`stock = $${queryIndex++}`); values.push(parseInt(stock)); }
        fields.push(`imagen_url = $${queryIndex++}`); values.push(new_imagen_url); 
        
        if (unidad_de_medida !== undefined) { fields.push(`unidad_de_medida = $${queryIndex++}`); values.push(unidad_de_medida); }
        if (categoria !== undefined) { fields.push(`categoria = $${queryIndex++}`); values.push(categoria); }
        if (disponible !== undefined) { fields.push(`disponible = $${queryIndex++}`); values.push(disponible); }

        if (fields.length === 0) {
            if (req.file) {
                console.log('UPDATE PRODUCT DEBUG: No hay campos para actualizar, intentando eliminar archivo subido:', req.file.filename); 
                await fs.unlink(path.join(IMAGES_UPLOAD_PATH, req.file.filename)).catch(err => console.error("Error al eliminar imagen subida sin otros campos de update:", err));
            }
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
        }

        values.push(id);
        const updateQuery = `UPDATE productos SET ${fields.join(', ')} WHERE id = $${queryIndex} RETURNING *`;

        console.log('UPDATE PRODUCT DEBUG: Ejecutando UPDATE en DB. Query:', updateQuery, 'Values:', values); 
        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            if (req.file) {
                console.log('UPDATE PRODUCT DEBUG: Producto no encontrado para update, intentando eliminar archivo subido:', req.file.filename); 
                await fs.unlink(path.join(IMAGES_UPLOAD_PATH, req.file.filename)).catch(err => console.error("Error al eliminar imagen subida por producto no encontrado (update):", err));
            }
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }
        console.log('UPDATE PRODUCT DEBUG: Producto actualizado en DB. Resultado:', result.rows[0]); 
        res.status(200).json({ product: result.rows[0], message: 'Producto actualizado exitosamente.' });
    } catch (err) {
        console.error('UPDATE PRODUCT ERROR: Error al actualizar producto en DB:', err); 
        if (req.file) {
            console.log('UPDATE PRODUCT DEBUG: Intentando eliminar archivo por fallo de DB (update):', req.file.filename); 
            await fs.unlink(path.join(IMAGES_UPLOAD_PATH, req.file.filename)).catch(unlinkErr => console.error("Error al eliminar imagen subida por fallo de DB (update):", unlinkErr));
        }
        res.status(500).json({ error: 'Error interno del servidor al actualizar el producto.' });
    }
};

exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    console.log('DELETE PRODUCT DEBUG: Iniciando deleteProduct para ID:', id); 
    try {
        console.log('DELETE PRODUCT DEBUG: Buscando imagen_url para eliminar producto ID:', id); 
        const productResult = await pool.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
        const imageUrlToDelete = productResult.rows[0] ? productResult.rows[0].imagen_url : null;
        console.log('DELETE PRODUCT DEBUG: imageUrlToDelete:', imageUrlToDelete); 

        console.log('DELETE PRODUCT DEBUG: Intentando eliminar producto de DB ID:', id); 
        const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            console.log('DELETE PRODUCT DEBUG: Producto no encontrado para eliminar ID:', id); 
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }
        console.log('DELETE PRODUCT DEBUG: Producto eliminado de DB. Resultado:', result.rows[0]); 

        if (imageUrlToDelete && imageUrlToDelete.startsWith('/api/images/')) {
            const imagePath = path.join(IMAGES_UPLOAD_PATH, imageUrlToDelete.replace('/api/images/', ''));
            console.log('DELETE PRODUCT DEBUG: Intentando eliminar archivo de imagen físico:', imagePath); 
            await fs.unlink(imagePath).catch(err => console.error("Error al eliminar archivo de imagen (delete):", err)); 
        }

        res.status(200).json({ message: 'Producto eliminado exitosamente.' });
    } catch (err) {
        console.error('DELETE PRODUCT ERROR: Error al eliminar producto en DB:', err); 
        res.status(500).json({ error: 'Error interno del servidor al eliminar el producto.' });
    }
};