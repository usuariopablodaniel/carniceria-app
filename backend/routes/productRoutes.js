// backend/routes/productRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware'); 

const multer = require('multer');
const path = require('path');
const fs = require('fs'); 

const productController = require('../controllers/productController');

// =======================================================
// === CONFIGURACIÓN DE MULTER PARA ALMACENAMIENTO ===
// =======================================================
// >>>>>>>>>>>>>>> RUTA DE UPLOADS: Asegúrate de que esta ruta coincida con server.js y productController.js <<<<<<<<<<<<<<<<
const IMAGES_UPLOAD_PATH = path.join('C:', 'temp', 'uploads', 'imagenes'); // Usamos la ruta C:\temp
console.log(`MULTER DEBUG: Ruta absoluta de imágenes de uploads (Multer config): ${IMAGES_UPLOAD_PATH}`);

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
        console.log(`MULTER DEBUG: destination function called. Saving to: ${IMAGES_UPLOAD_PATH}`);
        cb(null, IMAGES_UPLOAD_PATH); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, fileExtension);
        const newFilename = `${baseName.replace(/\s/g, '_')}-${uniqueSuffix}${fileExtension}`; 
        console.log(`MULTER DEBUG: filename function called. Generated name: ${newFilename}`);
        cb(null, newFilename);
    }
});

const fileFilter = (req, file, cb) => {
    console.log(`MULTER DEBUG: fileFilter function called. Verifying type: ${file.mimetype}`);
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
    console.log('ROUTE DEBUG: POST /api/products - Request received.');
    console.log('ROUTE DEBUG: POST /api/products - Content-Type:', req.headers['content-type']); 
    // Multer se ejecuta aquí como middleware
    upload.single('imagen')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('MULTER ERROR (POST /api/products):', err.message);
            return res.status(400).json({ error: `Error al subir imagen: ${err.message}` });
        } else if (err) {
            console.error('ERROR GENERAL DE SUBIDA (POST /api/products):', err.message);
            return res.status(500).json({ error: `Error al subir imagen: ${err.message}` });
        }
        console.log('MULTER DEBUG: Subida de imagen completada por Multer. req.file:', req.file);
        console.log('MULTER DEBUG: req.body (after Multer):', req.body); 
        if (!req.file) {
            console.error('MULTER CRITICAL: req.file es UNDEFINED o NULL después de Multer en POST. El archivo NO fue procesado o guardado.');
        }
        next(); 
    });
}, productController.addProduct);

// Editar un producto (con subida de imagen opcional)
router.put('/:id', protect, authorizeRoles('admin'), (req, res, next) => {
    console.log('ROUTE DEBUG: PUT /api/products/:id - Request received.');
    console.log('ROUTE DEBUG: PUT /api/products/:id - Content-Type:', req.headers['content-type']); 
    // Multer se ejecuta aquí como middleware
    upload.single('imagen')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('MULTER ERROR (PUT /api/products/:id):', err.message);
            return res.status(400).json({ error: `Error al actualizar imagen: ${err.message}` });
        } else if (err) {
            console.error('ERROR GENERAL DE SUBIDA (PUT /api/products/:id):', err.message);
            return res.status(500).json({ error: `Error al actualizar imagen: ${err.message}` });
        }
        console.log('MULTER DEBUG: Subida de imagen completada por Multer. req.file:', req.file);
        console.log('MULTER DEBUG: req.body (after Multer):', req.body); 
        if (!req.file) {
            console.error('MULTER CRITICAL: req.file es UNDEFINED o NULL después de Multer en PUT. El archivo NO fue procesado o guardado.');
        }
        next(); 
    });
}, productController.updateProduct);

router.delete('/:id', protect, authorizeRoles('admin'), productController.deleteProduct);

module.exports = router;