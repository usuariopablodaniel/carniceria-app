// backend/routes/productRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware'); 

const multer = require('multer');
const path = require('path');

const productController = require('../controllers/productController');

// =======================================================
// === CONFIGURACIÓN DE MULTER PARA ALMACENAMIENTO ===
// =======================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads', 'imagenes'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
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

// AÑADIDO: console.log para confirmar que esta ruta específica se está ejecutando
router.get('/:id', (req, res, next) => {
    console.log(`productRoutes.js: Manejando GET para /:id. ID: ${req.params.id}`);
    next(); // Pasa el control al controlador real
}, productController.getProductById);

// Añadir un producto (con subida de imagen)
router.post('/', protect, authorizeRoles('admin'), upload.single('imagen'), productController.addProduct);

// Editar un producto (con subida de imagen opcional)
router.put('/:id', protect, authorizeRoles('admin'), upload.single('imagen'), productController.updateProduct);

router.delete('/:id', protect, authorizeRoles('admin'), productController.deleteProduct);

module.exports = router;