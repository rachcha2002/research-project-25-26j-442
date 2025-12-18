// routes/storageRoutes.js
const express = require('express');
const multer = require('multer');
const { uploadFileHandler, getFileHandler, deleteFileHandler } = require('../controllers/uploadController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), uploadFileHandler);
router.get('/file/uploads/:key', getFileHandler);
router.delete("/deletefile/:key", deleteFileHandler);
module.exports = router;
