// backend/controllers/productController.js

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs/promises');

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

    if (req.file) {
        imagen_url = `/api/images/${req.file.filename}`;
    }

    const finalPrecio = (precio === undefined || precio === null || precio === '') ? null : parseFloat(precio);
    const finalPuntosCanje = (puntos_canje === undefined || puntos_canje === null || puntos_canje === '') ? null : parseInt(puntos_canje);

    if (!nombre || nombre.trim() === '') {
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

    if (isNaN(parseInt(stock)) || parseInt(stock) < 0) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error("Error al eliminar imagen subida por validación (stock inválido):", err));
        }
        return res.status(400).json({ error: 'El stock debe ser un número no negativo.' });
    }

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
                imagen_url,
                categoria,
                disponible,
                finalPuntosCanje
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al añadir producto en DB:', err.message);
        if (req.file) {
            await fs.unlink(req.file.path).catch(unlinkErr => console.error("Error al eliminar imagen subida por fallo de DB:", unlinkErr));
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

    const finalPrecio = (precio === undefined || precio === null || precio === '') ? null : parseFloat(precio);
    const finalPuntosCanje = (puntos_canje === undefined || puntos_canje === null || puntos_canje === '') ? null : parseInt(puntos_canje);

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

    try {
        const productResult = await pool.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
        const currentImageUrl = productResult.rows[0] ? productResult.rows[0].imagen_url : null;
        
        if (req.file) {
            new_imagen_url = `/api/images/${req.file.filename}`;
            if (currentImageUrl && currentImageUrl.startsWith('/api/images/')) {
                const oldImagePath = path.join(__dirname, '..', 'uploads', currentImageUrl.replace('/api/images/', ''));
                await fs.unlink(oldImagePath).catch(err => console.error("Error al eliminar imagen antigua:", err));
            }
        } else if (req.body.imagen_url_clear === 'true') {
            new_imagen_url = null;
            if (currentImageUrl && currentImageUrl.startsWith('/api/images/')) {
                const oldImagePath = path.join(__dirname, '..', 'uploads', currentImageUrl.replace('/api/images/', ''));
                await fs.unlink(oldImagePath).catch(err => console.error("Error al eliminar imagen por solicitud del cliente:", err));
            }
        } else {
            new_imagen_url = currentImageUrl;
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
                await fs.unlink(req.file.path).catch(err => console.error("Error al eliminar imagen subida sin otros campos de update:", err));
            }
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
        }

        values.push(id);
        const updateQuery = `UPDATE productos SET ${fields.join(', ')} WHERE id = $${queryIndex} RETURNING *`;

        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            if (req.file) {
                await fs.unlink(req.file.path).catch(err => console.error("Error al eliminar imagen subida por producto no encontrado:", err));
            }
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }
        res.status(200).json({ product: result.rows[0], message: 'Producto actualizado exitosamente.' });
    } catch (err) {
        console.error('Error al actualizar producto en DB:', err); // <-- Depuración detallada
        if (req.file) {
            await fs.unlink(req.file.path).catch(unlinkErr => console.error("Error al eliminar imagen subida por fallo de DB (update):", unlinkErr));
        }
        res.status(500).json({ error: 'Error interno del servidor al actualizar el producto.' });
    }
};

exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const productResult = await pool.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
        const imageUrlToDelete = productResult.rows[0] ? productResult.rows[0].imagen_url : null;

        const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }

        if (imageUrlToDelete && imageUrlToDelete.startsWith('/api/images/')) {
            const imagePath = path.join(__dirname, '..', 'uploads', imageUrlToDelete.replace('/api/images/', ''));
            await fs.unlink(imagePath).catch(err => console.error("Error al eliminar archivo de imagen (delete):", err)); // <-- Depuración detallada
        }

        res.status(200).json({ message: 'Producto eliminado exitosamente.' });
    } catch (err) {
        console.error('Error al eliminar producto en DB:', err); // <-- Depuración detallada
        res.status(500).json({ error: 'Error interno del servidor al eliminar el producto.' });
    }
};