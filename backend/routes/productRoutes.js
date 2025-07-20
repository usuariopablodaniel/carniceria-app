// backend/routes/productRoutes.js

const express = require('express');
const router = express.Router();
// ¡IMPORTANTE! Eliminamos la línea 'const { Pool } = require('pg');' y la sección del pool de aquí.
const { protect, authorizeRoles } = require('../middleware/authMiddleware'); 

const multer = require('multer'); // Importa Multer
const path = require('path');     // Importa 'path' para rutas

const productController = require('../controllers/productController'); // Importa el controlador de productos


// =======================================================
// === CONFIGURACIÓN DE MULTER PARA ALMACENAMIENTO (ESTO SE QUEDA) ===
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

router.get('/:id', productController.getProductById);

// Añadir un producto (con subida de imagen)
router.post('/', protect, authorizeRoles('admin'), upload.single('imagen'), productController.addProduct);

// Editar un producto (con subida de imagen opcional)
router.put('/:id', protect, authorizeRoles('admin'), upload.single('imagen'), productController.updateProduct);

router.delete('/:id', protect, authorizeRoles('admin'), productController.deleteProduct);

module.exports = router;