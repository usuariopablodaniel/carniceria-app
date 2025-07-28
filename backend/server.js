// backend/server.js
require('dotenv').config();
console.log('--- INICIO DE SERVER.JS ---');
console.log('CLIENT_URL cargado en backend (server.js):', process.env.CLIENT_URL);

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const path = require('path');
const fs = require('fs/promises');

console.log('Cargando configuración de Passport...');
require('./config/passport'); 

const app = express();
const port = process.env.PORT || 5000;

const UPLOADS_BASE_PATH = path.join('C:', 'Users', 'pablo', 'Pictures', 'uploads');
const IMAGES_UPLOAD_PATH = path.join(UPLOADS_BASE_PATH, 'imagenes');
console.log(`Ruta absoluta de imágenes de uploads: ${IMAGES_UPLOAD_PATH}`);

const pool = require('./db'); // Importar el pool desde el nuevo archivo db.js

// *** Importaciones de Rutas ***
console.log('Importando rutas...');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes'); 
const notificationRoutes = require('./routes/notifications'); 

// Middleware
console.log('Configurando middlewares generales...');
app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

console.log('Configurando sesiones para Passport...');
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

console.log('Inicializando Passport...');
app.use(passport.initialize());
app.use(passport.session());

// =======================================================
// === USO DE RUTAS DE API (todas las rutas, incluyendo Google, bajo /api/auth) ===
// =======================================================
console.log('Configurando rutas de API...');
app.use('/api/auth', (req, res, next) => { console.log('MIDDLEWARE: /api/auth'); next(); }, authRoutes);
app.use('/api/products', (req, res, next) => { console.log('MIDDLEWARE: /api/products'); next(); }, productRoutes); 
app.use('/api/transactions', (req, res, next) => { console.log('MIDDLEWARE: /api/transactions'); next(); }, transactionRoutes); 
app.use('/api/notifications', (req, res, next) => { console.log('MIDDLEWARE: /api/notifications'); next(); }, notificationRoutes); 
// =======================================================

// =======================================================
// === CONFIGURACIÓN PARA SERVIR ARCHIVOS ESTATICOS ===
// =======================================================
console.log('Configurando middleware para servir imágenes estáticas en /api/images...');
app.use('/api/images', (req, res, next) => {
    console.log(`MIDDLEWARE: Solicitud a /api/images. URL original: ${req.originalUrl}`);
    
    const fileName = req.url.startsWith('/api/images/') ? req.url.replace('/api/images/', '') : req.url;
    const decodedFileName = decodeURIComponent(fileName); 

    const fullImagePath = path.join(IMAGES_UPLOAD_PATH, decodedFileName); 

    fs.access(fullImagePath, fs.constants.F_OK)
        .then(() => {
            console.log(`MIDDLEWARE: Archivo de imagen encontrado: ${fullImagePath}`);
            next(); 
        })
        .catch((err) => {
            console.error(`ERROR: Archivo de imagen NO ENCONTRADO en el disco: ${fullImagePath}. Error: ${err.message}`);
            res.status(404).json({ error: 'Imagen no encontrada en el servidor.' });
        });
}, express.static(IMAGES_UPLOAD_PATH, {
    setHeaders: function (res, path, stat) {
        console.log(`MIDDLEWARE: express.static sirviendo: ${path}`);
        res.set('Cache-Control', 'no-store'); 
    },
    fallthrough: false 
}));

app.use('/api/images', (req, res) => {
    console.error(`ERROR: Fallback de /api/images alcanzado. Algo salió mal al servir la imagen.`);
    res.status(500).json({ error: 'Error interno al servir la imagen.' });
});
// =======================================================

// --- Rutas de Prueba para Verificar el Backend ---
console.log('Configurando rutas de prueba...');
app.get('/', (req, res) => {
    console.log('MIDDLEWARE: / (root) alcanzado.');
    res.send('Backend de la Carnicería funcionando!');
});

app.get('/db-test', async (req, res) => {
    console.log('MIDDLEWARE: /db-test alcanzado.');
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
console.log('Configurando middleware de manejo de errores...');
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
console.log('Configurando middleware para rutas 404...');
app.use((req, res) => {
    if (!res.headersSent) { 
        console.warn(`WARN: Ruta de API no encontrada: ${req.method} ${req.originalUrl}`);
        res.status(404).json({ error: 'Ruta de API no encontrada.' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
    console.log(`Imágenes estáticas disponibles en http://localhost:${port}/api/images/`); 
    console.log('--- SERVER.JS INICIADO ---');
});
