// backend/routes/productRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware'); 

const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Necesario para crear la carpeta si no existe

const productController = require('../controllers/productController');

// =======================================================
// === CONFIGURACIÓN DE MULTER PARA ALMACENAMIENTO ===
// =======================================================
// Define la ruta base de la carpeta de uploads de forma absoluta
const UPLOADS_BASE_PATH = path.join('C:', 'Users', 'pablo', 'Pictures', 'uploads');
const IMAGES_UPLOAD_PATH = path.join(UPLOADS_BASE_PATH, 'imagenes');

// Asegúrate de que la carpeta de destino exista. Multer no la crea automáticamente.
try {
    if (!fs.existsSync(IMAGES_UPLOAD_PATH)) {
        fs.mkdirSync(IMAGES_UPLOAD_PATH, { recursive: true });
        console.log(`MULTER DEBUG: Carpeta de uploads creada: ${IMAGES_UPLOAD_PATH}`);
    } else {
        console.log(`MULTER DEBUG: Carpeta de uploads ya existe: ${IMAGES_UPLOAD_PATH}`);
    }
} catch (err) {
    console.error(`MULTER ERROR: Error al crear la carpeta de uploads: ${IMAGES_UPLOAD_PATH}`, err);
}


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log(`MULTER DEBUG: Intentando guardar archivo en: ${IMAGES_UPLOAD_PATH}`);
        cb(null, IMAGES_UPLOAD_PATH); 
    },
    filename: (req, file, cb) => {
        const newFilename = Date.now() + '-' + file.originalname;
        console.log(`MULTER DEBUG: Generando nombre de archivo: ${newFilename}`);
        cb(null, newFilename);
    }
});

const fileFilter = (req, file, cb) => {
    console.log(`MULTER DEBUG: Verificando tipo de archivo: ${file.mimetype}`);
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        console.error(`MULTER ERROR: Tipo de archivo no permitido: ${file.mimetype}`);
        cb(new Error('Solo se permiten archivos de imagen (JPG, JPEG, PNG, GIF).'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite de tamaño: 5MB
    }
});
// =======================================================


// --- Rutas de Gestión de Productos ---

router.get('/', productController.getProducts);

router.get('/:id', (req, res, next) => {
    console.log(`productRoutes.js: Manejando GET para /:id. ID: ${req.params.id}`);
    next(); 
}, productController.getProductById);

// Añadir un producto (con subida de imagen)
router.post('/', protect, authorizeRoles('admin'), (req, res, next) => {
    console.log('ROUTE DEBUG: POST /api/products - Intentando subir imagen...');
    upload.single('imagen')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('MULTER ERROR (POST /api/products):', err.message);
            return res.status(400).json({ error: `Error al subir imagen: ${err.message}` });
        } else if (err) {
            console.error('ERROR GENERAL DE SUBIDA (POST /api/products):', err.message);
            return res.status(500).json({ error: `Error al subir imagen: ${err.message}` });
        }
        console.log('MULTER DEBUG: Subida de imagen completada por Multer. req.file:', req.file);
        next(); 
    });
}, productController.addProduct);

// Editar un producto (con subida de imagen opcional)
router.put('/:id', protect, authorizeRoles('admin'), (req, res, next) => {
    console.log('ROUTE DEBUG: PUT /api/products/:id - Intentando actualizar imagen...');
    upload.single('imagen')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('MULTER ERROR (PUT /api/products/:id):', err.message);
            return res.status(400).json({ error: `Error al actualizar imagen: ${err.message}` });
        } else if (err) {
            console.error('ERROR GENERAL DE SUBIDA (PUT /api/products/:id):', err.message);
            return res.status(500).json({ error: `Error al actualizar imagen: ${err.message}` });
        }
        console.log('MULTER DEBUG: Actualización de imagen completada por Multer. req.file:', req.file);
        next(); 
    });
}, productController.updateProduct);

router.delete('/:id', protect, authorizeRoles('admin'), productController.deleteProduct);

module.exports = router;