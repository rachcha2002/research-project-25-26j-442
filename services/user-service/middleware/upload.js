const multer = require('multer');

/**
 * Multer configuration for file uploads
 * Uses memory storage to buffer files before uploading to R2
 */

// File filter - only allow images
const imageFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory before uploading to R2
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFilter
});

/**
 * Middleware to handle multer errors
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 5MB.' 
      });
    }
    return res.status(400).json({ 
      error: `Upload error: ${err.message}` 
    });
  } else if (err) {
    return res.status(400).json({ 
      error: err.message 
    });
  }
  next();
};

module.exports = {
  upload,
  handleMulterError
};
