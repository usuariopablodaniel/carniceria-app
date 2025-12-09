const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const pool = require('../db');

// @route   POST /api/transactions/purchase
// @desc    Registrar compra y asignar puntos
// @access  Private (Admin/Employee)
router.post('/purchase', protect, async (req, res) => {
    const { userId, amount } = req.body;
    const adminId = req.user.id;

    if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'ID de usuario y monto válidos son requeridos.' });
    }

    try {
        await pool.query('BEGIN');

        // Obtener puntos actuales
        const userResult = await pool.query('SELECT puntos_actuales FROM clientes WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        const currentPoints = userResult.rows[0].puntos_actuales || 0;

        // Calcular nuevos puntos (1 punto cada $10.000, ejemplo)
        const pointsToAdd = Math.floor(amount / 10000);
        const newPoints = currentPoints + pointsToAdd;

        // Actualizar cliente
        await pool.query(
            'UPDATE clientes SET puntos_actuales = $1 WHERE id = $2',
            [newPoints, userId]
        );

        // Insertar transacción
        await pool.query(
            'INSERT INTO transacciones_puntos (cliente_id, tipo_transaccion, monto_compra, puntos_cantidad, fecha_transaccion, realizada_por_admin_id) VALUES ($1, $2, $3, $4, NOW(), $5)',
            [userId, 'compra', amount, pointsToAdd, adminId]
        );

        await pool.query('COMMIT');

        res.status(200).json({
            message: `Compra de $${amount} registrada. Se añadieron ${pointsToAdd} puntos.`,
            newPoints: newPoints
        });

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error al registrar compra y asignar puntos:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al registrar la compra.' });
    }
});

// @route   POST /api/transactions/redeem
// @desc    Canjear puntos por producto
// @access  Private (Admin/Employee)
router.post('/redeem', protect, async (req, res) => {
    const { userId, pointsToRedeem, productId } = req.body;
    const adminId = req.user.id;
    let validatedProductId = parseInt(productId, 10);

    if (isNaN(validatedProductId) || validatedProductId <= 0) {
        return res.status(400).json({ error: 'ID de producto inválido. Debe ser un número positivo.' });
    }

    if (!userId || !pointsToRedeem || pointsToRedeem <= 0) {
        return res.status(400).json({ error: 'ID de usuario y puntos a canjear son requeridos.' });
    }

    try {
        await pool.query('BEGIN');

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

        const productResult = await pool.query('SELECT nombre, puntos_canje FROM productos WHERE id = $1', [validatedProductId]);
        
        if (productResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Producto de canje no encontrado.' });
        }
        const product = productResult.rows[0];

        if (product.puntos_canje !== pointsToRedeem) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: `Discrepancia en puntos: El producto requiere ${product.puntos_canje}.` });
        }

        const newPoints = currentPoints - pointsToRedeem;
        
        await pool.query(
            'UPDATE clientes SET puntos_actuales = $1 WHERE id = $2',
            [newPoints, userId]
        );

        await pool.query(
            'INSERT INTO transacciones_puntos (cliente_id, tipo_transaccion, puntos_cantidad, premio_canjeado_id, fecha_transaccion, realizada_por_admin_id) VALUES ($1, $2, $3, $4, NOW(), $5)',
            [userId, 'canje', -pointsToRedeem, validatedProductId, adminId]
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

// ====================================================================
// >>>>>>>>> RUTA DE HISTORIAL DE TRANSACCIONES (Últimas 10) <<<<<<<<<<
// @route   GET /api/transactions/user/:userId
// @desc    Obtener las últimas 10 transacciones de un usuario específico
// @access  Private (Admin/Employee)
router.get('/user/:userId', protect, async (req, res) => {
    const { userId } = req.params;
    const requestingUser = req.user;

    // Validación de seguridad extra: solo admins/empleados pueden ver historiales ajenos
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'employee') {
        return res.status(403).json({ error: 'No autorizado para ver el historial de transacciones.' });
    }

    try {
        const query = `
            SELECT
                t.tipo_transaccion,
                t.monto_compra,
                t.puntos_cantidad,
                t.fecha_transaccion,
                p.nombre AS nombre_producto_canjeado,
                c.nombre AS scanner_user
            FROM
                transacciones_puntos t
            LEFT JOIN
                productos p ON t.premio_canjeado_id = p.id
            LEFT JOIN
                clientes c ON t.realizada_por_admin_id = c.id
            WHERE
                t.cliente_id = $1
            ORDER BY
                t.fecha_transaccion DESC
            LIMIT 10;
        `;
        
        const result = await pool.query(query, [userId]);
        
        // Formateamos la respuesta para el frontend
        const transactions = result.rows.map(row => ({
            transaction_date: row.fecha_transaccion,
            transaction_type: row.tipo_transaccion === 'compra' ? 'Puntos Añadidos' : 'REDEMPTION',
            scanner_user: row.scanner_user || 'Sistema',
            monto_compra: row.monto_compra,
            puntos_cantidad: row.puntos_cantidad,
            producto_canjeado: row.nombre_producto_canjeado
        }));
        
        res.status(200).json(transactions);
        
    } catch (err) {
        console.error(`Error al obtener historial usuario ${userId}:`, err.message);
        res.status(500).json({ error: 'Error al obtener el historial.' });
    }
});
// ====================================================================

// @route   GET /api/transactions/:userId/points
// @desc    Obtener puntos actuales de un usuario (Simple)
router.get('/:userId/points', protect, async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query('SELECT puntos_actuales FROM clientes WHERE id = $1', [userId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
        res.status(200).json({ points: result.rows[0].puntos_actuales || 0 });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error servidor.' });
    }
});

module.exports = router;