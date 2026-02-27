const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { r2Client, isR2Enabled, bucketName, publicUrl } = require('../config/r2');

/**
 * Upload file to Cloudflare R2
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {String} originalName - Original filename
 * @param {String} mimeType - File MIME type
 * @param {String} folder - Folder in bucket (e.g., 'profile-pictures', 'baby-photos')
 * @returns {Promise<String>} - Public URL of uploaded file
 */
const uploadToR2 = async (fileBuffer, originalName, mimeType, folder = 'uploads') => {
  if (!isR2Enabled) {
    throw new Error('R2 is not configured. Please set up R2 environment variables.');
  }

  try {
    // Generate unique filename
    const fileExtension = path.extname(originalName);
    const uniqueFilename = `${folder}/${uuidv4()}${fileExtension}`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueFilename,
      Body: fileBuffer,
      ContentType: mimeType,
      // Make file publicly accessible
      // Note: You need to configure your R2 bucket for public access
      CacheControl: 'public, max-age=31536000', // Cache for 1 year
    });

    await r2Client.send(command);

    // Construct public URL
    const fileUrl = `${publicUrl}/${uniqueFilename}`;
    
    return fileUrl;
  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error(`Failed to upload file to R2: ${error.message}`);
  }
};

/**
 * Delete file from Cloudflare R2
 * @param {String} fileUrl - Public URL of the file
 * @returns {Promise<Boolean>} - Success status
 */
const deleteFromR2 = async (fileUrl) => {
  if (!isR2Enabled) {
    console.warn('R2 is not configured, skipping delete');
    return false;
  }

  try {
    // Extract key from URL
    const urlObj = new URL(fileUrl);
    const key = urlObj.pathname.substring(1); // Remove leading slash

    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error('R2 delete error:', error);
    return false;
  }
};

module.exports = {
  uploadToR2,
  deleteFromR2
};
