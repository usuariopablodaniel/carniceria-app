const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { protect } = require('../middleware/authMiddleware'); // Para proteger rutas
// const { authorize } = require('../middleware/authMiddleware'); // Si tuvieras roles para admins

// Configuración de la base de datos
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// --- Rutas de Gestión de Productos ---

// @route   GET /api/products
// @desc    Obtener todos los productos
// @access  Public (cualquier usuario puede ver productos)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY nombre ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener productos:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener productos.' });
    }
});

// @route   GET /api/products/:id
// @desc    Obtener un producto por ID
// @access  Public
router.get('/:id', async (req, res) => {
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
});

// @route   POST /api/products
// @desc    Añadir un nuevo producto (solo admins)
// @access  Private (requiere token), Admin (opcional, si implementas roles)
router.post('/', protect, async (req, res) => {
    // Opcional: Si quieres que solo los administradores puedan añadir productos,
    // necesitarías una función 'authorize' en tu authMiddleware que verifique 'req.user.es_admin'
    // router.post('/', protect, authorize(['admin']), async (req, res) => {
    const { nombre, descripcion, precio, stock, unidad_de_medida, imagen_url, categoria, disponible } = req.body;

    // Validación básica
    if (!nombre || !precio || !stock) {
        return res.status(400).json({ error: 'Nombre, precio y stock son campos obligatorios.' });
    }
    if (isNaN(precio) || precio <= 0) {
        return res.status(400).json({ error: 'El precio debe ser un número positivo.' });
    }
    if (isNaN(stock) || stock < 0) {
        return res.status(400).json({ error: 'El stock debe ser un número no negativo.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO productos (nombre, descripcion, precio, stock, unidad_de_medida, imagen_url, categoria, disponible)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [nombre, descripcion, precio, stock, unidad_de_medida, imagen_url, categoria, disponible]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al añadir producto:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al añadir el producto.' });
    }
});

// @route   PUT /api/products/:id
// @desc    Actualizar un producto existente (solo admins)
// @access  Private, Admin
router.put('/:id', protect, async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, unidad_de_medida, imagen_url, categoria, disponible } = req.body;

    // Validación (similar a POST, pero todos son opcionales para la actualización)
    if (precio !== undefined && (isNaN(precio) || precio <= 0)) {
        return res.status(400).json({ error: 'El precio debe ser un número positivo.' });
    }
    if (stock !== undefined && (isNaN(stock) || stock < 0)) {
        return res.status(400).json({ error: 'El stock debe ser un número no negativo.' });
    }

    try {
        const fields = [];
        const values = [];
        let queryIndex = 1;

        if (nombre !== undefined) { fields.push(`nombre = $${queryIndex++}`); values.push(nombre); }
        if (descripcion !== undefined) { fields.push(`descripcion = $${queryIndex++}`); values.push(descripcion); }
        if (precio !== undefined) { fields.push(`precio = $${queryIndex++}`); values.push(precio); }
        if (stock !== undefined) { fields.push(`stock = $${queryIndex++}`); values.push(stock); }
        if (unidad_de_medida !== undefined) { fields.push(`unidad_de_medida = $${queryIndex++}`); values.push(unidad_de_medida); }
        if (imagen_url !== undefined) { fields.push(`imagen_url = $${queryIndex++}`); values.push(imagen_url); }
        if (categoria !== undefined) { fields.push(`categoria = $${queryIndex++}`); values.push(categoria); }
        if (disponible !== undefined) { fields.push(`disponible = $${queryIndex++}`); values.push(disponible); }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
        }

        values.push(id); // El ID es el último valor
        const updateQuery = `UPDATE productos SET ${fields.join(', ')} WHERE id = $${queryIndex} RETURNING *`;

        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al actualizar producto:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al actualizar el producto.' });
    }
});

// @route   DELETE /api/products/:id
// @desc    Eliminar un producto (solo admins)
// @access  Private, Admin
router.delete('/:id', protect, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }
        res.json({ message: 'Producto eliminado exitosamente.' });
    } catch (err) {
        console.error('Error al eliminar producto:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al eliminar el producto.' });
    }
});

module.exports = router;