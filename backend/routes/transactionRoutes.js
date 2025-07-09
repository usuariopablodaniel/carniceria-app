// backend/routes/transactions.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { protect } = require('../middleware/authMiddleware'); // Importa el middleware de protección

// Configuración de la base de datos
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// @route   POST /api/transactions/purchase
// @desc    Register a purchase and assign points to a user
// @access  Private (Admin/Employee)
router.post('/purchase', protect, async (req, res) => {
    const { userId, amount } = req.body;
    const adminId = req.user.id; // ID del admin/empleado que realiza la operación

    if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'ID de usuario y monto válidos son requeridos.' });
    }

    try {
        // Iniciar una transacción de base de datos
        await pool.query('BEGIN');

        // 1. Obtener el usuario
        const userResult = await pool.query('SELECT puntos_actuales FROM clientes WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        const currentPoints = userResult.rows[0].puntos_actuales || 0;

        // 2. Calcular puntos a añadir (ej. 1 punto por cada $10000 ARS)
        // >>>>>>>>>>>>>>> CORRECCIÓN AQUÍ: Dividir por 10000 <<<<<<<<<<<<<<<<
        const pointsToAdd = Math.floor(amount / 10000); 
        const newPoints = currentPoints + pointsToAdd;

        // 3. Actualizar los puntos del usuario
        await pool.query(
            'UPDATE clientes SET puntos_actuales = $1 WHERE id = $2',
            [newPoints, userId]
        );

        // 4. Registrar la transacción
        await pool.query(
            'INSERT INTO transacciones_puntos (cliente_id, tipo_transaccion, monto_compra, puntos_cantidad, fecha_transaccion, realizada_por_admin_id) VALUES ($1, $2, $3, $4, NOW(), $5)',
            [userId, 'compra', amount, pointsToAdd, adminId]
        );

        // Confirmar la transacción
        await pool.query('COMMIT');

        res.status(200).json({
            message: `Compra de $${amount} registrada. Se añadieron ${pointsToAdd} puntos.`,
            newPoints: newPoints
        });

    } catch (err) {
        await pool.query('ROLLBACK'); // Revertir si hay un error
        console.error('Error al registrar compra y asignar puntos:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al registrar la compra.' });
    }
});

// @route   POST /api/transactions/redeem
// @desc    Redeem points for a user
// @access  Private (Admin/Employee)
router.post('/redeem', protect, async (req, res) => {
    const { userId, pointsToRedeem, productId } = req.body;
    const adminId = req.user.id; // ID del admin/empleado que realiza la operación

    if (!userId || !pointsToRedeem || pointsToRedeem <= 0 || !productId) {
        return res.status(400).json({ error: 'ID de usuario, puntos a canjear y ID de producto son requeridos.' });
    }

    try {
        await pool.query('BEGIN');

        // 1. Obtener el usuario y sus puntos actuales
        const userResult = await pool.query('SELECT puntos_actuales FROM clientes WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        const currentPoints = userResult.rows[0].puntos_actuales || 0;

        if (currentPoints < pointsToRedeem) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: 'Puntos insuficientes para realizar el canje.' });
        }

        // 2. Obtener el producto de canje para verificar puntos_canje
        const productResult = await pool.query('SELECT nombre, puntos_canje FROM productos WHERE id = $1', [productId]);
        if (productResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Producto de canje no encontrado.' });
        }
        const product = productResult.rows[0];

        if (product.puntos_canje !== pointsToRedeem) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: `Los puntos a canjear (${pointsToRedeem}) no coinciden con los del producto (${product.puntos_canje}).` });
        }

        // 3. Actualizar los puntos del usuario
        const newPoints = currentPoints - pointsToRedeem;
        await pool.query(
            'UPDATE clientes SET puntos_actuales = $1 WHERE id = $2',
            [newPoints, userId]
        );

        // 4. Registrar la transacción de canje
        await pool.query(
            'INSERT INTO transacciones_puntos (cliente_id, tipo_transaccion, puntos_cantidad, premio_canjeado_id, fecha_transaccion, realizada_por_admin_id) VALUES ($1, $2, $3, $4, NOW(), $5)',
            [userId, 'canje', -pointsToRedeem, productId, adminId] // Puntos afectados como negativo para canje
        );

        await pool.query('COMMIT');

        res.status(200).json({
            message: `Canje de "${product.nombre}" por ${pointsToRedeem} puntos realizado.`,
            newPoints: newPoints
        });

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error al canjear puntos:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al canjear puntos.' });
    }
});

// @route   GET /api/transactions/:userId/points
// @desc    Get current points for a specific user
// @access  Private (User itself or Admin/Employee)
router.get('/:userId/points', protect, async (req, res) => {
    const { userId } = req.params;
    const requestingUser = req.user; // Usuario autenticado del token

    // Autorización: solo el propio usuario o un admin/empleado puede ver los puntos
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'employee' && requestingUser.id.toString() !== userId.toString()) {
        return res.status(403).json({ error: 'No autorizado para ver los puntos de este usuario.' });
    }

    try {
        const result = await pool.query('SELECT puntos_actuales FROM clientes WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        res.status(200).json({ points: result.rows[0].puntos_actuales || 0 });
    } catch (err) {
        console.error('Error al obtener puntos del usuario:', err.message);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// RUTA DE HISTORIAL DE TRANSACCIONES
router.get('/history/:userId', protect, async (req, res) => {
    const { userId } = req.params;
    const requestingUser = req.user;

    if (requestingUser.role !== 'admin' && requestingUser.role !== 'employee' && requestingUser.id.toString() !== userId.toString()) {
        return res.status(403).json({ error: 'No autorizado para ver el historial de transacciones de este usuario.' });
    }

    try {
        const query = `
            SELECT 
                t.id,
                t.tipo_transaccion,
                t.monto_compra,
                t.puntos_cantidad,
                t.fecha_transaccion,
                p.nombre AS nombre_producto_canjeado,
                c.nombre AS nombre_admin_realizo
            FROM 
                transacciones_puntos t
            LEFT JOIN 
                productos p ON t.premio_canjeado_id = p.id
            LEFT JOIN
                clientes c ON t.realizada_por_admin_id = c.id
            WHERE 
                t.cliente_id = $1
            ORDER BY 
                t.fecha_transaccion DESC;
        `;
        const result = await pool.query(query, [userId]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener el historial de transacciones:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener el historial de transacciones.' });
    }
});

module.exports = router;
