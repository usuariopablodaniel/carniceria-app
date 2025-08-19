// backend/routes/productRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware'); 

// Importar el middleware de Multer y Cloudinary
const { upload, uploadToCloudinary } = require('../middleware/upload'); 

const productController = require('../controllers/productController');

// --- Rutas de Gestión de Productos ---

// Middleware de limpieza para usar en las rutas
const cleanBodyMiddleware = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].replace(/\u00A0/g, ' ').trim();
            }
        }
    }
    next();
};

router.get('/', productController.getProducts);

router.get('/:id', productController.getProductById);

// Añadir un producto (con subida de imagen)
router.post(
    '/', 
    protect, 
    authorizeRoles('admin'), 
    upload.single('imagen'), 
    uploadToCloudinary, 
    cleanBodyMiddleware, // <<-- NUEVO MIDDLEWARE DE LIMPIEZA
    productController.addProduct
);

// Editar un producto (con subida de imagen opcional)
router.put(
    '/:id', 
    protect, 
    authorizeRoles('admin'), 
    upload.single('imagen'), 
    uploadToCloudinary, 
    cleanBodyMiddleware, // <<-- NUEVO MIDDLEWARE DE LIMPIEZA
    productController.updateProduct
);

router.delete('/:id', protect, authorizeRoles('admin'), productController.deleteProduct);

module.exports = router;