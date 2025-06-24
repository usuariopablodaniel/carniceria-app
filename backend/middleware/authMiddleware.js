// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const asyncHandler = require('express-async-handler');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // QUITAR ESTAS LÍNEAS DE DEPURACIÓN (o comentarlas)
    // console.log('--- AuthMiddleware Debugging ---');
    // console.log('JWT_SECRET usado para VERIFICAR (authMiddleware.js):', process.env.JWT_SECRET); 

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            // QUITAR ESTA LÍNEA DE DEPURACIÓN (o comentarla)
            // console.log('Token recibido:', token); 

            // Intenta verificar el token con process.env.JWT_SECRET
            const decoded = jwt.verify(token, process.env.JWT_SECRET); 
            // QUITAR ESTA LÍNEA DE DEPURACIÓN (o comentarla)
            // console.log('Token decodificado exitosamente:', decoded); 

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
            // Mantén este console.error para errores reales en producción
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
        // Mantén este console.log para indicar la falta de token (útil para depuración frontend)
        console.log('No token en la cabecera Authorization.');
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