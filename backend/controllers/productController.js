// backend/controllers/productController.js

const { Pool } = require('pg'); // Importa la conexión a la base de datos
const path = require('path');   // Para construir rutas de archivos
const fs = require('fs/promises'); // Para manejar archivos (eliminar)

// Configuración de la base de datos PostgreSQL
// **IMPORTANTE**: Si tienes un archivo db.js que exporta el pool, úsalo aquí:
// const pool = require('../db'); // Si tu db.js exporta el pool.
// Si no, manten esta configuración:
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});


// @desc    Obtener todos los productos
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY nombre ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener productos:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener productos.' });
    }
};

// @desc    Obtener un producto por ID
// @route   GET /api/products/:id
// @access  Public
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

// @desc    Añadir un nuevo producto
// @route   POST /api/products
// @access  Admin
exports.addProduct = async (req, res) => {
    // Multer ya ha procesado el archivo y lo ha puesto en req.file (si se subió)
    // Los campos de texto del formulario están en req.body
    const { nombre, descripcion, precio, stock, unidad_de_medida, categoria, disponible, puntos_canje } = req.body;
    let imagen_url = null; // Inicializamos la URL de la imagen a null

    // Si Multer subió un archivo, la información estará en req.file
    if (req.file) {
        // Construye la URL pública de la imagen
        // Ejemplo: /images/12345-mi-imagen.jpg
        imagen_url = `/images/${req.file.filename}`;
    }

    // Convertir precio y puntos_canje a NULL si vienen como cadena vacía o no definidos
    const finalPrecio = (precio === undefined || precio === null || precio === '') ? null : parseFloat(precio);
    const finalPuntosCanje = (puntos_canje === undefined || puntos_canje === null || puntos_canje === '') ? null : parseInt(puntos_canje);

    // --- VALIDACIONES DE LÓGICA DE NEGOCIO (repitamos del frontend, crucial en backend) ---
    // Validar que nombre y stock sean obligatorios
    if (!nombre || nombre.trim() === '') {
        // Si hay un error de validación y ya se subió una imagen, elimínala
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error("Error al eliminar imagen subida por validación (nombre):", err));
        }
        return res.status(400).json({ error: 'El nombre del producto es obligatorio.' });
    }
    if (stock === undefined || stock === null || stock === '') {
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error("Error al eliminar imagen subida por validación (stock):", err));
        }
        return res.status(400).json({ error: 'El stock es obligatorio.' });
    }

    // Validar que se ingrese uno y solo uno de los dos (precio o puntos)
    const hasPriceInput = finalPrecio !== null;
    const hasPointsInput = finalPuntosCanje !== null;

    if (!hasPriceInput && !hasPointsInput) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error("Error al eliminar imagen subida por validación (precio/puntos):", err));
        }
        return res.status(400).json({ error: 'Debe ingresar un Precio o Puntos de Canje para el producto.' });
    }
    if (hasPriceInput && hasPointsInput) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error("Error al eliminar imagen subida por validación (ambos):", err));
        }
        return res.status(400).json({ error: 'No puede ingresar Precio y Puntos de Canje a la vez. Elija uno.' });
    }

    // Validar el precio si fue ingresado
    if (hasPriceInput) {
        if (isNaN(finalPrecio) || finalPrecio <= 0) {
            if (req.file) {
                await fs.unlink(req.file.path).catch(err => console.error("Error al eliminar imagen subida por validación (precio inválido):", err));
            }
            return res.status(400).json({ error: 'El precio debe ser un número positivo.' });
        }
    }

    // Validar los puntos de canje si fueron ingresados
    if (hasPointsInput) {
        if (isNaN(finalPuntosCanje) || finalPuntosCanje < 0) { // Puntos pueden ser 0
            if (req.file) {
                await fs.unlink(req.file.path).catch(err => console.error("Error al eliminar imagen subida por validación (puntos inválidos):", err));
            }
            return res.status(400).json({ error: 'Los puntos de canje deben ser un número no negativo.' });
        }
    }

    // Validar stock
    if (isNaN(parseInt(stock)) || parseInt(stock) < 0) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error("Error al eliminar imagen subida por validación (stock inválido):", err));
        }
        return res.status(400).json({ error: 'El stock debe ser un número no negativo.' });
    }
    // --- FIN VALIDACIONES ---

    try {
        const result = await pool.query(
            `INSERT INTO productos (nombre, descripcion, precio, stock, unidad_de_medida, imagen_url, categoria, disponible, puntos_canje)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
                nombre,
                descripcion,
                finalPrecio,
                parseInt(stock),
                unidad_de_medida,
                imagen_url, // Guarda la URL de la imagen (o null si no se subió)
                categoria,
                disponible,
                finalPuntosCanje
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al añadir producto en DB:', err.message);
        // Si hay un error en la DB (ej. restricción de NOT NULL) y ya se subió una imagen, elimínala
        if (req.file) {
            await fs.unlink(req.file.path).catch(unlinkErr => console.error("Error al eliminar imagen subida por fallo de DB:", unlinkErr));
        }
        if (err.code === '23502') { // Error de not-null constraint violation en PostgreSQL
             res.status(400).json({ error: 'Faltan campos obligatorios o hay un problema de formato en la base de datos.' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor al añadir el producto.' });
        }
    }
};

// @desc    Actualizar un producto existente
// @route   PUT /api/products/:id
// @access  Admin
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    // La imagen_url en req.body contendrá la URL existente del producto, si no se envió una nueva imagen
    const { nombre, descripcion, precio, stock, unidad_de_medida, categoria, disponible, puntos_canje } = req.body;
    let new_imagen_url = null; // Para la nueva URL de la imagen

    // Convertir precio y puntos_canje a NULL si vienen como cadena vacía
    const finalPrecio = (precio === undefined || precio === null || precio === '') ? null : parseFloat(precio);
    const finalPuntosCanje = (puntos_canje === undefined || puntos_canje === null || puntos_canje === '') ? null : parseInt(puntos_canje);

    // --- VALIDACIONES DE LÓGICA DE NEGOCIO (repitamos del frontend, crucial en backend) ---
    const hasPriceInput = finalPrecio !== null;
    const hasPointsInput = finalPuntosCanje !== null;

    if (hasPriceInput && hasPointsInput) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error("Error al eliminar imagen subida por validación (ambos):", err));
        }
        return res.status(400).json({ error: 'No puede actualizar Precio y Puntos de Canje a la vez. Elija uno.' });
    }
    if (hasPriceInput) {
        if (isNaN(finalPrecio) || finalPrecio <= 0) {
            if (req.file) {
                await fs.unlink(req.file.path).catch(err => console.error("Error al eliminar imagen subida por validación (precio inválido):", err));
            }
            return res.status(400).json({ error: 'El precio debe ser un número positivo.' });
        }
    }
    if (hasPointsInput) {
        if (isNaN(finalPuntosCanje) || finalPuntosCanje < 0) {
            if (req.file) {
                await fs.unlink(req.file.path).catch(err => console.error("Error al eliminar imagen subida por validación (puntos inválidos):", err));
            }
            return res.status(400).json({ error: 'Los puntos de canje deben ser un número no negativo.' });
        }
    }
    if (stock !== undefined && (isNaN(parseInt(stock)) || parseInt(stock) < 0)) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error("Error al eliminar imagen subida por validación (stock inválido):", err));
        }
        return res.status(400).json({ error: 'El stock debe ser un número no negativo.' });
    }
    // --- FIN VALIDACIONES ---

    try {
        // 1. Obtener la URL de la imagen actual del producto desde la DB
        const productResult = await pool.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
        const currentImageUrl = productResult.rows[0] ? productResult.rows[0].imagen_url : null;
        
        // 2. Determinar la nueva URL de la imagen y manejar la eliminación de la antigua
        if (req.file) {
            // Se ha subido una nueva imagen, usar la de Multer
            new_imagen_url = `/images/${req.file.filename}`;
            // Si había una imagen anterior, la eliminamos del sistema de archivos
            if (currentImageUrl && currentImageUrl.startsWith('/images/')) {
                const oldImagePath = path.join(__dirname, '..', 'uploads', currentImageUrl.replace('/images/', ''));
                await fs.unlink(oldImagePath).catch(err => console.error("Error al eliminar imagen antigua:", err));
            }
        } else if (req.body.imagen_url_clear === 'true') { // Si el frontend envió una bandera para borrar la imagen (MODIFICADO)
            new_imagen_url = null; // Establecer a NULL en la DB
            // Si había una imagen anterior, la eliminamos
            if (currentImageUrl && currentImageUrl.startsWith('/images/')) {
                const oldImagePath = path.join(__dirname, '..', 'uploads', currentImageUrl.replace('/images/', ''));
                await fs.unlink(oldImagePath).catch(err => console.error("Error al eliminar imagen por solicitud del cliente:", err));
            }
        } else {
            // No se subió un nuevo archivo Y no se pidió eliminar la imagen.
            // Mantener la imagen_url existente en la base de datos.
            new_imagen_url = currentImageUrl; // Mantenemos la URL actual de la DB
        }

        const fields = [];
        const values = [];
        let queryIndex = 1;

        // Añadir campos solo si se proporcionan en el body
        if (nombre !== undefined) { fields.push(`nombre = $${queryIndex++}`); values.push(nombre); }
        if (descripcion !== undefined) { fields.push(`descripcion = $${queryIndex++}`); values.push(descripcion); }
        
        // Manejo de precio y puntos_canje
        if (hasPriceInput) {
            fields.push(`precio = $${queryIndex++}`); values.push(finalPrecio);
            fields.push(`puntos_canje = $${queryIndex++}`); values.push(null);
        } else if (hasPointsInput) {
            fields.push(`puntos_canje = $${queryIndex++}`); values.push(finalPuntosCanje);
            fields.push(`precio = $${queryIndex++}`); values.push(null);
        } else {
            // Si no se actualiza ni precio ni puntos_canje, no los incluimos en el SET
            // Pero si por alguna razón vinieran en el body pero vacíos (e.g. precio: ""),
            // ya los convertimos a null con finalPrecio, por lo que su valor se manejará
            // como tal si se incluyen los campos.
            // Para asegurar que si se envía "precio": "" y "puntos_canje": "" se establezcan a NULL,
            // podemos hacer esto:
            // fields.push(`precio = $${queryIndex++}`); values.push(null);
            // fields.push(`puntos_canje = $${queryIndex++}`); values.push(null);
            // Pero esto forzaría a NULL incluso si no se envía ningún valor, lo cual es otra lógica.
            // La lógica actual solo actualiza si hay un valor diferente de undefined.
        }

        if (stock !== undefined) { fields.push(`stock = $${queryIndex++}`); values.push(parseInt(stock)); }
        // ¡IMPORTANTE! La imagen_url SIEMPRE se actualiza aquí porque la hemos determinado arriba.
        fields.push(`imagen_url = $${queryIndex++}`); values.push(new_imagen_url); 
        
        if (unidad_de_medida !== undefined) { fields.push(`unidad_de_medida = $${queryIndex++}`); values.push(unidad_de_medida); }
        if (categoria !== undefined) { fields.push(`categoria = $${queryIndex++}`); values.push(categoria); }
        if (disponible !== undefined) { fields.push(`disponible = $${queryIndex++}`); values.push(disponible); }

        if (fields.length === 0) {
            // Si se subió un archivo pero no hay otros campos para actualizar
            if (req.file) {
                await fs.unlink(req.file.path).catch(err => console.error("Error al eliminar imagen subida sin otros campos de update:", err));
            }
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
        }

        values.push(id); // El ID es el último valor
        const updateQuery = `UPDATE productos SET ${fields.join(', ')} WHERE id = $${queryIndex} RETURNING *`;

        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            // Si no se encontró el producto, eliminar la imagen subida si la hubo
            if (req.file) {
                await fs.unlink(req.file.path).catch(err => console.error("Error al eliminar imagen subida por producto no encontrado:", err));
            }
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }
        res.status(200).json({ product: result.rows[0], message: 'Producto actualizado exitosamente.' }); // MODIFICADO
    } catch (err) {
        console.error('Error al actualizar producto en DB:', err.message);
        // Si hubo un error en la DB después de subir una nueva imagen, elimínala
        if (req.file) {
            await fs.unlink(req.file.path).catch(unlinkErr => console.error("Error al eliminar imagen subida por fallo de DB:", unlinkErr));
        }
        res.status(500).json({ error: 'Error interno del servidor al actualizar el producto.' });
    }
};

// @desc    Eliminar un producto
// @route   DELETE /api/products/:id
// @access  Admin
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        // Antes de eliminar el producto de la DB, obtener la URL de su imagen para eliminar el archivo
        const productResult = await pool.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
        const imageUrlToDelete = productResult.rows[0] ? productResult.rows[0].imagen_url : null;

        const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }

        // Si el producto tenía una imagen y es una ruta de nuestro servidor, elimínala del sistema de archivos
        if (imageUrlToDelete && imageUrlToDelete.startsWith('/images/')) {
            const imagePath = path.join(__dirname, '..', 'uploads', imageUrlToDelete.replace('/images/', ''));
            // Usamos fs.unlink para eliminar el archivo. El catch es para evitar que un error de eliminación
            // de archivo (ej. archivo no encontrado) impida que la eliminación de la DB sea exitosa.
            await fs.unlink(imagePath).catch(err => console.error("Error al eliminar archivo de imagen:", err));
        }

        res.status(200).json({ message: 'Producto eliminado exitosamente.' });
    } catch (err) {
        console.error('Error al eliminar producto en DB:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al eliminar el producto.' });
    }
};