// backend/server.js
require('dotenv').config();
console.log('CLIENT_URL cargado en backend (server.js):', process.env.CLIENT_URL);

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const path = require('path');

require('./config/passport'); // Configuración de Passport

const app = express();
const port = process.env.PORT || 5000;

// *** Importaciones de Rutas ***
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/productRoutes'); // <-- CORREGIDO: Eliminada la duplicación
const transactionRoutes = require('./routes/transactionRoutes'); 

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // Asegúrate de que esta sea la URL de tu frontend
    credentials: true // Muy importante para las cookies de sesión de Passport
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// Configuración de Sesiones para Passport
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Inicializar Passport y Restaurar Sesión
app.use(passport.initialize());
app.use(passport.session());

// =======================================================
// === USO DE RUTAS DE API ===
// =======================================================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes); 
app.use('/api/transactions', transactionRoutes); 
// =======================================================

// =======================================================
// === CONFIGURACIÓN PARA SERVIR ARCHIVOS ESTATICOS ===
// =======================================================
// Esta línea hace que la carpeta 'carniceria-app/backend/uploads/imagenes'
// sea accesible a través de la URL '/api/images'.
app.use('/api/images', express.static(path.join(__dirname, 'uploads', 'imagenes'))); 
// =======================================================

// --- Rutas de Prueba para Verificar el Backend ---
app.get('/', (req, res) => {
    res.send('Backend de la Carnicería funcionando!');
});

app.get('/db-test', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        res.json({ message: 'Conexión a la base de datos exitosa!', time: result.rows[0].now });
    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).json({ error: 'Error al conectar a la base de datos', details: err.message });
    }
});

// Middleware de manejo de errores centralizado (al final)
app.use((err, req, res, next) => {
    console.error('Error global de Express:', err.stack);
    if (res.headersSent) {
        return next(err);
    }
    res.status(err.statusCode || 500).json({
        message: err.message || 'Error interno del servidor.',
        error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
    console.log(`Imágenes estáticas disponibles en http://localhost:${port}/api/images/`); 
});