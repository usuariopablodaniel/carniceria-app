// backend/controllers/productController.js

const pool = require('../db'); 
const cloudinary = require('cloudinary').v2; // Importamos Cloudinary para la eliminación de imágenes

// >>>>>>>>>>>>>>> FUNCIÓN AUXILIAR PARA ELIMINAR IMAGEN EN CLOUDINARY <<<<<<<<<<<<<<<<
const deleteImageFromCloudinary = async (imageUrl) => {
  if (!imageUrl) return;

  // Extraer el publicId de la URL de Cloudinary
  const publicId = imageUrl.split('/').pop().split('.')[0];
  
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`Imagen con publicId ${publicId} eliminada de Cloudinary.`);
  } catch (err) {
    console.error("Error al eliminar imagen de Cloudinary:", err);
  }
};
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

// @desc    Obtener todos los productos
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener productos:', err.message);
    res.status(500).json({ error: 'Error interno del servidor al obtener productos.' });
  }
};

// @desc    Obtener un producto por ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener producto por ID:', err.message);
    res.status(500).json({ error: 'Error interno del servidor al obtener el producto.' });
  }
};

// @desc    Añadir un nuevo producto
// @route   POST /api/products
// @access  Private (Admin)
exports.addProduct = async (req, res) => {
  const { nombre, descripcion, precio, stock, unidad_de_medida, categoria, disponible, puntos_canje } = req.body;
  let imagen_url = req.body.imagenUrl || null;

  const finalPrecio = (precio === undefined || precio === null || precio === '') ? null : parseFloat(precio);
  const finalPuntosCanje = (puntos_canje === undefined || puntos_canje === null || puntos_canje === '') ? null : parseInt(puntos_canje);

  const handleValidationError = async () => {
    if (req.body.imagenUrl) {
      await deleteImageFromCloudinary(req.body.imagenUrl);
    }
  };

  if (!nombre || nombre.trim() === '') {
    await handleValidationError();
    return res.status(400).json({ error: 'El nombre del producto es obligatorio.' });
  }
  if (stock === undefined || stock === null || stock === '') {
    await handleValidationError();
    return res.status(400).json({ error: 'El stock es obligatorio.' });
  }
  const hasPriceInput = finalPrecio !== null;
  const hasPointsInput = finalPuntosCanje !== null;

  if (!hasPriceInput && !hasPointsInput) {
    await handleValidationError();
    return res.status(400).json({ error: 'Debe ingresar un Precio o Puntos de Canje para el producto.' });
  }
  if (hasPriceInput && hasPointsInput) {
    await handleValidationError();
    return res.status(400).json({ error: 'No puede ingresar Precio y Puntos de Canje a la vez. Elija uno.' });
  }
  if (hasPriceInput) {
    if (isNaN(finalPrecio) || finalPrecio <= 0) {
      await handleValidationError();
      return res.status(400).json({ error: 'El precio debe ser un número positivo.' });
    }
  }
  if (hasPointsInput) {
    if (isNaN(finalPuntosCanje) || finalPuntosCanje < 0) {
      await handleValidationError();
      return res.status(400).json({ error: 'Los puntos de canje deben ser un número no negativo.' });
    }
  }
  const parsedStock = parseInt(stock);
  if (isNaN(parsedStock) || parsedStock < 0) {
    await handleValidationError();
    return res.status(400).json({ error: 'El stock debe ser un número no negativo.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO productos (nombre, descripcion, precio, stock, unidad_de_medida, imagen_url, categoria, disponible, puntos_canje)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        nombre,
        descripcion,
        finalPrecio, 
        parsedStock, 
        unidad_de_medida,
        imagen_url, 
        categoria,
        disponible,
        finalPuntosCanje 
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('ADD PRODUCT ERROR: Error al añadir producto en DB:', err.message);
    await handleValidationError();
    if (err.code === '23502') { 
      res.status(400).json({ error: 'Faltan campos obligatorios o hay un problema de formato en la base de datos.' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor al añadir el producto.' });
    }
  }
};

// @desc    Actualizar un producto existente
// @route   PUT /api/products/:id
// @access  Private (Admin)
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock, unidad_de_medida, categoria, disponible, puntos_canje, imagen_url_clear } = req.body; 
  let new_imagen_url = req.body.imagenUrl || null; 

  const finalPrecio = (precio === undefined || precio === null || precio === '') ? null : parseFloat(precio);
  const finalPuntosCanje = (puntos_canje === undefined || puntos_canje === null || puntos_canje === '') ? null : parseInt(puntos_canje);

  const hasPriceInput = finalPrecio !== null;
  const hasPointsInput = finalPuntosCanje !== null;

  const handleValidationError = async () => {
    if (req.body.imagenUrl) {
      await deleteImageFromCloudinary(req.body.imagenUrl);
    }
  };

  if (hasPriceInput && hasPointsInput) {
    await handleValidationError();
    return res.status(400).json({ error: 'No puede actualizar Precio y Puntos de Canje a la vez. Elija uno.' });
  }
  if (hasPriceInput) {
    if (isNaN(finalPrecio) || finalPrecio <= 0) {
      await handleValidationError();
      return res.status(400).json({ error: 'El precio debe ser un número positivo.' });
    }
  }
  if (hasPointsInput) {
    if (isNaN(finalPuntosCanje) || finalPuntosCanje < 0) {
      await handleValidationError();
      return res.status(400).json({ error: 'Los puntos de canje deben ser un número no negativo.' });
    }
  }
  const parsedStock = (stock !== undefined && stock !== null && stock !== '') ? parseInt(stock) : undefined;
  if (stock !== undefined && (isNaN(parsedStock) || parsedStock < 0)) {
    await handleValidationError();
    return res.status(400).json({ error: 'El stock debe ser un número no negativo.' });
  }

  try {
    const productResult = await pool.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
    if (productResult.rows.length === 0) {
      await handleValidationError(); 
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    const currentImageUrl = productResult.rows[0].imagen_url; 

    if (req.body.imagenUrl) { // Se subió una nueva imagen
      // Si hay una imagen anterior, la eliminamos de Cloudinary
      if (currentImageUrl) {
        await deleteImageFromCloudinary(currentImageUrl);
      }
      new_imagen_url = req.body.imagenUrl;
    } else if (imagen_url_clear === 'true') { // Solicitud para eliminar la imagen
      if (currentImageUrl) {
        await deleteImageFromCloudinary(currentImageUrl);
      }
      new_imagen_url = null;
    } else { // No se subió nueva imagen ni se pidió eliminar la actual
      new_imagen_url = currentImageUrl;
    }

    const fields = [];
    const values = [];
    let queryIndex = 1;

    if (nombre !== undefined) { fields.push(`nombre = $${queryIndex++}`); values.push(nombre); }
    if (descripcion !== undefined) { fields.push(`descripcion = $${queryIndex++}`); values.push(descripcion); }
    
    if (hasPriceInput) {
      fields.push(`precio = $${queryIndex++}`); values.push(finalPrecio);
      fields.push(`puntos_canje = $${queryIndex++}`); values.push(null); 
    } else if (hasPointsInput) {
      fields.push(`puntos_canje = $${queryIndex++}`); values.push(finalPuntosCanje);
      fields.push(`precio = $${queryIndex++}`); values.push(null); 
    }

    if (stock !== undefined && parsedStock !== undefined) { fields.push(`stock = $${queryIndex++}`); values.push(parsedStock); }
    
    fields.push(`imagen_url = $${queryIndex++}`); values.push(new_imagen_url); 
    
    if (unidad_de_medida !== undefined) { fields.push(`unidad_de_medida = $${queryIndex++}`); values.push(unidad_de_medida); }
    if (categoria !== undefined) { fields.push(`categoria = $${queryIndex++}`); values.push(categoria); }
    if (disponible !== undefined) { fields.push(`disponible = $${queryIndex++}`); values.push(disponible); }

    if (fields.length === 0) {
      await handleValidationError();
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
    }

    values.push(id); 
    const updateQuery = `UPDATE productos SET ${fields.join(', ')} WHERE id = $${queryIndex} RETURNING *`;
    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      await handleValidationError(); 
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.status(200).json({ product: result.rows[0], message: 'Producto actualizado exitosamente.' });
  } catch (err) {
    console.error('UPDATE PRODUCT ERROR: Error al actualizar producto en DB:', err); 
    await handleValidationError(); 
    res.status(500).json({ error: 'Error interno del servidor al actualizar el producto.' });
  }
};

// @desc    Eliminar un producto
// @route   DELETE /api/products/:id
// @access  Private (Admin)
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  let client; 
  try {
    client = await pool.connect(); 
    await client.query('BEGIN'); 

    const productResult = await client.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
    const imageUrlToDelete = productResult.rows[0] ? productResult.rows[0].imagen_url : null;
    
    // >>>>>>>>>>>>>>> CORRECCIÓN: Usar 'premio_canjeado_id' <<<<<<<<<<<<<<<<
    await client.query('DELETE FROM transacciones_puntos WHERE premio_canjeado_id = $1', [id]);

    const result = await client.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK'); 
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    // Eliminar la imagen de Cloudinary si existe una URL
    if (imageUrlToDelete) {
      await deleteImageFromCloudinary(imageUrlToDelete);
    }

    await client.query('COMMIT'); 
    res.status(200).json({ message: 'Producto eliminado exitosamente.' });
  } catch (err) {
    console.error('DELETE PRODUCT ERROR: Error al eliminar producto en DB:', err); 
    if (client) {
      await client.query('ROLLBACK'); 
    }
    res.status(500).json({ error: 'Error interno del servidor al eliminar el producto.' });
  } finally {
    if (client) {
      client.release(); 
    }
  }
};