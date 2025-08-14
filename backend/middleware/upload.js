// backend/middleware/upload.js
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const upload = multer({
  storage: multer.memoryStorage()
});

const uploadToCloudinary = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const stream = cloudinary.uploader.upload_stream({
    folder: 'carniceria-app' // O el nombre de la carpeta que prefieras en Cloudinary
  }, (error, result) => {
    if (error) {
      console.error('Error al subir a Cloudinary:', error);
      return res.status(500).json({ error: 'Error al subir la imagen' });
    }
    req.body.imagenUrl = result.secure_url;
    next();
  });

  streamifier.createReadStream(req.file.buffer).pipe(stream);
};

module.exports = { upload, uploadToCloudinary };