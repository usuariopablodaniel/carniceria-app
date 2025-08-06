// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const pool = require('../db'); // Importar el pool centralizado

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET); 

            const userResult = await pool.query(
                'SELECT id, nombre, email, puntos_actuales, role FROM clientes WHERE id = $1',
                [decoded.id]
            );

            if (userResult.rows.length === 0) {
                res.status(401);
                throw new Error('No autorizado, usuario no encontrado');
            }
            
            req.user = userResult.rows[0]; 

            next();

        } catch (error) {
            console.error('ERROR en AuthMiddleware - token verification:', error.name, error.message);
            if (error.name === 'TokenExpiredError') {
                res.status(401);
                throw new Error('No autorizado, token expirado');
            } else if (error.name === 'JsonWebTokenError') {
                res.status(401);
                throw new Error('No autorizado, token inválido o malformado');
            } else {
                res.status(401);
                throw new Error('No autorizado, token fallido (error desconocido)');
            }
        }
    } else {
        res.status(401);
        throw new Error('No autorizado, no hay token');
    }
});

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403);
            throw new Error(`Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}`);
        }
        next();
    };
};

module.exports = { protect, authorizeRoles };