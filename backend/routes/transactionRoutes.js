const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const pool = require('../db'); 

// @route   POST /api/transactions/purchase
// @desc    Register a purchase and assign points to a user
// @access  Private (Admin/Employee)
router.post('/purchase', protect, async (req, res) => {
    const { userId, amount } = req.body;
    const adminId = req.user.id; 

    if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'ID de usuario y monto válidos son requeridos.' });
    }

    try {
        await pool.query('BEGIN');

        const userResult = await pool.query('SELECT puntos_actuales FROM clientes WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        const currentPoints = userResult.rows[0].puntos_actuales || 0;

        const pointsToAdd = Math.floor(amount / 10000); 
        const newPoints = currentPoints + pointsToAdd;

        await pool.query(
            'UPDATE clientes SET puntos_actuales = $1 WHERE id = $2',
            [newPoints, userId]
        );

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

// @route   POST /api/transactions/redeem
// @desc    Redeem points for a user
// @access  Private (Admin/Employee)
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
            return res.status(404).json({ error: 'Producto de canje no encontrado en la base de datos de productos.' });
        }
        const product = productResult.rows[0];

        if (product.puntos_canje !== pointsToRedeem) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: `Los puntos a canjear (${pointsToRedeem}) no coinciden con los del producto (${product.puntos_canje}).` });
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

// @route   GET /api/transactions/:userId/points
// @desc    Get current points for a specific user
// @access  Private (User itself or Admin/Employee)
router.get('/:userId/points', protect, async (req, res) => {
    const { userId } = req.params;
    const requestingUser = req.user; 

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

// ====================================================================
// >>>>>>>>> RUTA DE HISTORIAL DE TRANSACCIONES (Ruta corregida) <<<<<<<<<<
// La ruta ahora es solo '/user/:userId' para coincidir con la llamada del frontend.
// ====================================================================

// @route   GET /api/transactions/user/:userId
// @desc    Get the last 10 transactions for a specific user (Used by UserManagementPage)
// @access  Private (Admin/Employee)
router.get('/user/:userId', protect, async (req, res) => {
    const { userId } = req.params;
    const requestingUser = req.user;

    // Autorización: Solo Admin/Empleado puede usar esta ruta para consultar a otros.
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
                -- Trae el nombre del empleado que realizó la transacción
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
        
        // Mapeamos los resultados para asegurar que los nombres de las keys coincidan exactamente
        // con lo que el frontend espera (transaction_date, transaction_type, scanner_user)
        const transactions = result.rows.map(row => ({
            transaction_date: row.fecha_transaccion,
            transaction_type: row.tipo_transaccion === 'compra' ? 'Puntos Añadidos' : 'REDEMPTION', // Aseguramos que el tipo sea claro
            scanner_user: row.scanner_user || 'Sistema', 
            monto_compra: row.monto_compra,
            puntos_cantidad: row.puntos_cantidad,
            producto_canjeado: row.nombre_producto_canjeado
        }));
        
        res.status(200).json(transactions);
        
    } catch (err) {
        console.error(`Error al obtener el historial de transacciones para el usuario ${userId}:`, err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener el historial de transacciones.' });
    }
});

module.exports = router;