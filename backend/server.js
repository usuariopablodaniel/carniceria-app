// backend/server.js
require('dotenv').config();
// console.log('--- INICIO DE SERVER.JS ---'); // Eliminado
// console.log('CLIENT_URL cargado en backend (server.js):', process.env.CLIENT_URL); // Eliminado

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const path = require('path');
const fs = require('fs/promises'); 

// console.log('Cargando configuración de Passport...'); // Eliminado
require('./config/passport'); 

const app = express();
const port = process.env.PORT || 5000;

// Ruta de uploads (la que hemos acordado usar fuera de OneDrive)
const UPLOADS_BASE_PATH = path.join('C:', 'temp', 'uploads');
const IMAGES_UPLOAD_PATH = path.join(UPLOADS_BASE_PATH, 'imagenes');
// console.log(`Ruta absoluta de imágenes de uploads: ${IMAGES_UPLOAD_PATH}`); // Eliminado

// Asegúrate de que la carpeta de destino exista.
fs.mkdir(IMAGES_UPLOAD_PATH, { recursive: true })
    .then(() => {
        // console.log(`Carpeta de uploads asegurada: ${IMAGES_UPLOAD_PATH}`); // Eliminado
    })
    .catch(err => console.error(`Error al asegurar la carpeta de uploads: ${IMAGES_UPLOAD_PATH}`, err));


const pool = require('./db'); 

// *** Importaciones de Rutas ***
// console.log('Importando rutas...'); // Eliminado
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/productRoutes'); 
const transactionRoutes = require('./routes/transactionRoutes'); 
const notificationRoutes = require('./routes/notifications'); 

// Middleware
// console.log('Configurando middlewares generales...'); // Eliminado
app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true 
}));

// console.log('Configurando sesiones para Passport...'); // Eliminado
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// console.log('Inicializando Passport...'); // Eliminado
app.use(passport.initialize());
app.use(passport.session());

// =======================================================
// === USO DE RUTAS DE API ===
// =======================================================
// console.log('Configurando rutas de API...'); // Eliminado

// >>>>>>>>>>>>>>> ESTO ES CRÍTICO Y CORRECTO PARA MULTER <<<<<<<<<<<<<<<<
// Las rutas de Productos (que usan Multer) se definen PRIMERO.
// Multer se aplica DENTRO de productRoutes.js, y al estar esta línea antes
// de express.json/urlencoded, Multer tendrá la oportunidad de procesar
// el 'multipart/form-data' antes de que el body sea consumido.
app.use('/api/products', (req, res, next) => { /* console.log('MIDDLEWARE: /api/products'); */ next(); }, productRoutes); // Comentado o eliminado log

// >>>>>>>>>>>>>>> ESTO ES CRÍTICO Y CORRECTO PARA JSON/URL-ENCODED <<<<<<<<<<<<<<<<
// express.json() y express.urlencoded() se aplican DESPUÉS de las rutas de productos.
// Esto significa que Multer ya procesó el body para /api/products.
// Para las demás rutas (auth, transactions, notifications), estos middlewares
// se ejecutarán y parsearán los bodies JSON o URL-encoded correctamente.
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

// Rutas que esperan JSON o URL-encoded bodies
app.use('/api/auth', (req, res, next) => { /* console.log('MIDDLEWARE: /api/auth'); */ next(); }, authRoutes); // Comentado o eliminado log
app.use('/api/transactions', (req, res, next) => { /* console.log('MIDDLEWARE: /api/transactions'); */ next(); }, transactionRoutes); // Comentado o eliminado log
app.use('/api/notifications', (req, res, next) => { /* console.log('MIDDLEWARE: /api/notifications'); */ next(); }, notificationRoutes); // Comentado o eliminado log
// =======================================================

// =======================================================
// === CONFIGURACIÓN PARA SERVIR ARCHIVOS ESTATICOS ===
// =======================================================
// console.log('Configurando middleware para servir imágenes estáticas en /api/images...'); // Eliminado
app.use('/api/images', express.static(IMAGES_UPLOAD_PATH, {
    setHeaders: function (res, path, stat) {
        // console.log(`MIDDLEWARE: express.static sirviendo: ${path}`); // Eliminado
        res.set('Cache-Control', 'no-cache'); 
    },
    fallthrough: false 
}));

app.use('/api/images', (req, res) => {
    console.error(`ERROR: Fallback de /api/images alcanzado. Esto indica un problema con express.static.`);
    res.status(500).json({ error: 'Error interno al servir la imagen.' });
});
// =======================================================

// --- Rutas de Prueba para Verificar el Backend ---
// console.log('Configurando rutas de prueba...'); // Eliminado
app.get('/', (req, res) => {
    // console.log('MIDDLEWARE: / (root) alcanzado.'); // Eliminado
    res.send('Backend de la Carnicería funcionando!');
});

app.get('/db-test', async (req, res) => {
    // console.log('MIDDLEWARE: /db-test alcanzado.'); // Eliminado
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
// console.log('Configurando middleware de manejo de errores...'); // Eliminado
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
// console.log('Configurando middleware para rutas 404...'); // Eliminado
app.use((req, res) => {
    if (!res.headersSent) { 
        // console.warn(`WARN: Ruta de API no encontrada: ${req.method} ${req.originalUrl}`); // Eliminado
        res.status(404).json({ error: 'Ruta de API no encontrada.' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
    // console.log(`Imágenes estáticas disponibles en http://localhost:${port}/api/images/`); // Eliminado
    // console.log('--- SERVER.JS INICIADO ---'); // Eliminado
});