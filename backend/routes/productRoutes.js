// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
// Importa ambos middlewares: protect y authorizeRoles
const { protect, authorizeRoles } = require('../middleware/authMiddleware'); 

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
// @access  Private (requiere token), Admin
// MODIFICACIÓN: Añade authorizeRoles('admin') para restringir a admins
router.post('/', protect, authorizeRoles('admin'), async (req, res) => {
    // >>>>>>>>>>>>>> MODIFICACIONES AQUÍ: Añadir puntos_canje y ajustar desestructuración <<<<<<<<<<<<
    const { nombre, descripcion, precio, stock, unidad_de_medida, imagen_url, categoria, disponible, puntos_canje } = req.body;

    // Determinar si se ingresó precio o puntos de canje (para backend)
    const hasPriceInput = (precio !== undefined && precio !== null && precio !== '');
    const hasPointsInput = (puntos_canje !== undefined && puntos_canje !== null && puntos_canje !== '');

    // >>>>>>>>>>>>>> MODIFICACIONES AQUÍ: Validaciones para precio y puntos_canje <<<<<<<<<<<<
    // Validar que nombre y stock sean obligatorios
    if (!nombre || !stock) {
        return res.status(400).json({ error: 'Nombre y Stock son campos obligatorios.' });
    }

    // Validar que se ingrese uno y solo uno de los dos (precio o puntos)
    if (!hasPriceInput && !hasPointsInput) {
        return res.status(400).json({ error: 'Debe ingresar un Precio o Puntos de Canje para el producto.' });
    }
    if (hasPriceInput && hasPointsInput) {
        return res.status(400).json({ error: 'No puede ingresar Precio y Puntos de Canje a la vez. Elija uno.' });
    }

    // Validar el precio si fue ingresado
    if (hasPriceInput) {
        if (isNaN(precio) || parseFloat(precio) <= 0) {
            return res.status(400).json({ error: 'El precio debe ser un número positivo.' });
        }
    }

    // Validar los puntos de canje si fueron ingresados
    if (hasPointsInput) {
        if (isNaN(puntos_canje) || parseInt(puntos_canje) < 0) { // Puntos pueden ser 0
            return res.status(400).json({ error: 'Los puntos de canje deben ser un número no negativo.' });
        }
    }

    // Validar stock
    if (isNaN(stock) || parseInt(stock) < 0) {
        return res.status(400).json({ error: 'El stock debe ser un número no negativo.' });
    }
    // >>>>>>>>>>>>>> FIN MODIFICACIONES EN VALIDACIONES <<<<<<<<<<<<<<<<

    try {
        // >>>>>>>>>>>>>> MODIFICACIONES AQUÍ: Incluir puntos_canje en la consulta SQL <<<<<<<<<<<<
        // Asegúrate de que tu tabla 'productos' en PostgreSQL tenga una columna 'puntos_canje' (tipo INTEGER o NUMERIC)
        // Y que la columna 'precio' pueda aceptar NULLs (e.g., FLOAT o NUMERIC)
        const result = await pool.query(
            `INSERT INTO productos (nombre, descripcion, precio, stock, unidad_de_medida, imagen_url, categoria, disponible, puntos_canje)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
                nombre,
                descripcion,
                hasPriceInput ? parseFloat(precio) : null, // Enviar precio como null si no está presente
                parseInt(stock), // Asegurarse de que stock sea un entero
                unidad_de_medida,
                imagen_url,
                categoria,
                disponible,
                hasPointsInput ? parseInt(puntos_canje) : null // Enviar puntos_canje como null si no está presente
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al añadir producto:', err.message);
        // Puedes agregar una lógica para verificar si el error es por una restricción de la base de datos
        if (err.code === '23502') { // error de not-null constraint violation en PostgreSQL
             res.status(400).json({ error: 'Faltan campos obligatorios o hay un problema de formato en la base de datos.' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor al añadir el producto.' });
        }
    }
});

// @route   PUT /api/products/:id
// @desc    Actualizar un producto existente (solo admins)
// @access  Private, Admin
// MODIFICACIÓN: Añade authorizeRoles('admin') para restringir a admins
router.put('/:id', protect, authorizeRoles('admin'), async (req, res) => {
    const { id } = req.params;
    // >>>>>>>>>>>>>> MODIFICACIONES AQUÍ: Añadir puntos_canje a la desestructuración del PUT <<<<<<<<<<<<
    const { nombre, descripcion, precio, stock, unidad_de_medida, imagen_url, categoria, disponible, puntos_canje } = req.body;

    // Determinar si se ingresó precio o puntos de canje (para backend)
    const hasPriceInput = (precio !== undefined && precio !== null && precio !== '');
    const hasPointsInput = (puntos_canje !== undefined && puntos_canje !== null && puntos_canje !== '');

    // >>>>>>>>>>>>>> MODIFICACIONES AQUÍ: Nuevas validaciones para PUT <<<<<<<<<<<<
    // Si ambos se envían o ninguno se envía en la actualización, es un error (si ambos campos están presentes en el body)
    if (hasPriceInput && hasPointsInput) {
        return res.status(400).json({ error: 'No puede actualizar Precio y Puntos de Canje a la vez. Elija uno.' });
    }
    // Si se envía precio, validar que sea positivo
    if (hasPriceInput) {
        if (isNaN(precio) || parseFloat(precio) <= 0) {
            return res.status(400).json({ error: 'El precio debe ser un número positivo.' });
        }
    }
    // Si se envía puntos_canje, validar que sea no negativo
    if (hasPointsInput) {
        if (isNaN(puntos_canje) || parseInt(puntos_canje) < 0) {
            return res.status(400).json({ error: 'Los puntos de canje deben ser un número no negativo.' });
        }
    }
    // >>>>>>>>>>>>>> FIN MODIFICACIONES EN VALIDACIONES PUT <<<<<<<<<<<<<<<<

    // Validación de stock (ya estaba bien, solo la reordenamos si fuese necesario)
    if (stock !== undefined && (isNaN(stock) || parseInt(stock) < 0)) {
        return res.status(400).json({ error: 'El stock debe ser un número no negativo.' });
    }

    try {
        const fields = [];
        const values = [];
        let queryIndex = 1;

        if (nombre !== undefined) { fields.push(`nombre = $${queryIndex++}`); values.push(nombre); }
        if (descripcion !== undefined) { fields.push(`descripcion = $${queryIndex++}`); values.push(descripcion); }
        
        // >>>>>>>>>>>>>> MODIFICACIONES AQUÍ: Manejo de precio y puntos_canje en UPDATE <<<<<<<<<<<<
        if (hasPriceInput) { // Si se envió precio, actualizamos precio a su valor y puntos_canje a null
            fields.push(`precio = $${queryIndex++}`); values.push(parseFloat(precio));
            fields.push(`puntos_canje = $${queryIndex++}`); values.push(null); 
        } else if (hasPointsInput) { // Si se envió puntos_canje, actualizamos puntos_canje a su valor y precio a null
            fields.push(`puntos_canje = $${queryIndex++}`); values.push(parseInt(puntos_canje));
            fields.push(`precio = $${queryIndex++}`); values.push(null);
        } else { // Si ninguno se envió, pero los campos existen en el body, asegurarse de que no se modifiquen inadvertidamente.
                 // Aquí optamos por no incluir el campo en la actualización si no se proporcionó un valor explícito.
                 // Si quisieras que enviar vacío significara NULL, la lógica sería diferente.
                 // Por simplicidad, si no se envió precio ni puntos, no los incluimos en el update SET
        }
        // >>>>>>>>>>>>>> FIN MODIFICACIONES EN UPDATE <<<<<<<<<<<<<<<<

        if (stock !== undefined) { fields.push(`stock = $${queryIndex++}`); values.push(parseInt(stock)); }
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
// MODIFICACIÓN: Añade authorizeRoles('admin') para restringir a admins
router.delete('/:id', protect, authorizeRoles('admin'), async (req, res) => {
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