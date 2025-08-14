// backend/server.js
// IMPORTANTE: Este archivo ha sido corregido para funcionar correctamente en el entorno de producción de Render.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const path = require('path');

// Cargar la configuración de Passport
require('./config/passport'); 

const app = express();
// El puerto ahora es dinámico, asignado por Render en producción, o 5000 en local.
const port = process.env.PORT || 5000;

const pool = require('./db'); 

// Importaciones de Rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/productRoutes'); 
const transactionRoutes = require('./routes/transactionRoutes'); 
const notificationRoutes = require('./routes/notifications'); 

// === CORRECCIÓN CLAVE: CONFIGURACIÓN DE CORS ===
// Para que el frontend en Vercel pueda comunicarse con el backend en Render,
// el 'origin' debe permitir la URL de Vercel.
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(cors({
    origin: clientUrl,
    credentials: true 
}));

// === CORRECCIÓN CLAVE: CONFIGURACIÓN DE SESIONES ===
// 'secure: true' es necesario para cookies en producción.
// 'sameSite: "none"' también es necesario para que funcione con dominios cruzados (Vercel -> Render).
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: true, 
        sameSite: 'none'
    }
}));


app.use(passport.initialize());
app.use(passport.session());

// =======================================================
// === USO DE RUTAS DE API ===
// =======================================================
// Nota: 'express.json()' y 'express.urlencoded' deben ir ANTES de las rutas que las usan.
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use('/api/products', productRoutes); 
app.use('/api/auth', authRoutes); 
app.use('/api/transactions', transactionRoutes); 
app.use('/api/notifications', notificationRoutes); 

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
    console.error('ERROR GLOBAL de Express:', err.stack);
    if (res.headersSent) {
        return next(err);
    }
    res.status(err.statusCode || 500).json({
        message: err.message || 'Error interno del servidor.',
        error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});

// Middleware para manejar rutas no encontradas (404) para el resto de la API
app.use((req, res) => {
    if (!res.headersSent) { 
        res.status(404).json({ error: 'Ruta de API no encontrada.' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor backend corriendo en el puerto ${port}`);
});