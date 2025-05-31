const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { Pool } = require('pg'); // Necesitamos el cliente de PostgreSQL

// Configuración de la base de datos (usando las variables de entorno)
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Verifica si el token está presente en los headers de autorización
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Obtener token del header
      token = req.headers.authorization.split(' ')[1]; // "Bearer TOKEN"

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Obtener usuario de la base de datos usando el ID del token
      const userResult = await pool.query('SELECT id, nombre, email, puntos_actuales FROM clientes WHERE id = $1', [decoded.id]);
      
      // Si el usuario no fue encontrado
      if (userResult.rows.length === 0) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      // Adjuntar la información del usuario al objeto req
      req.user = userResult.rows[0]; 

      next(); // Continúa con la siguiente función de middleware o ruta
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  // Si no hay token
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

module.exports = { protect };