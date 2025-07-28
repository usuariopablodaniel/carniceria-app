// backend/db.js
const { Pool } = require('pg');
require('dotenv').config(); // Asegúrate de cargar las variables de entorno aquí también si no lo haces globalmente

console.log('Configurando pool de PostgreSQL en db.js...');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Exportar el pool para que pueda ser importado por otros módulos
module.exports = pool;