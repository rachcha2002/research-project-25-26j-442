const { Upload } = require('@aws-sdk/lib-storage');
const { GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client } = require('../db/Driveconfig');

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

// Helper function to upload file to R2
const uploadToR2 = async (file) => {
    // Generate a unique remote key (filename in R2)
    const remoteKey = `${Date.now()}-${file.originalname}`;

    // Use the buffer from multer directly
    const uploader = new Upload({
        client: s3Client,
        params: {
            Bucket: BUCKET_NAME,
            Key: remoteKey,
            Body: file.buffer, // Use the file buffer
            ContentType: file.mimetype, // Set the correct content type
        },
    });

    const data = await uploader.done();
    return {
        location: data.Location,
        key: remoteKey,
        fileName: file.originalname
    };
};

exports.uploadToR2 = uploadToR2;

exports.uploadFileHandler = async (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }

    try {
        const result = await uploadToR2(req.file);
        res.status(200).json({
            message: "File uploaded successfully",
            ...result
        });

    } catch (error) {
        console.error("Error during upload:", error);
        res.status(500).send("Failed to upload file to R2.");
    }
};

exports.getFileHandler = async (req, res) => {
    try {
        const { key } = req.params; // file key passed in route

        if (!key) {
            return res.status(400).json({ message: "File key is required" });
        }

        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key
        });

        const data = await s3Client.send(command);

        // Set correct headers for browser download
        res.setHeader("Content-Type", data.ContentType || "application/octet-stream");
        res.setHeader("Content-Length", data.ContentLength);
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${key.split('/').pop()}"`
        );

        // Stream file to response
        data.Body.pipe(res);

    } catch (error) {
        console.error("Error retrieving file:", error);
        res.status(500).json({ message: "Error downloading file from R2" });
    }
};

// Helper function to delete file from R2
const deleteFromR2 = async (key) => {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
    });
    await s3Client.send(command);
};

exports.deleteFromR2 = deleteFromR2;

exports.deleteFileHandler = async (req, res) => {
    try {
        const { key } = req.params; // file key passed in URL

        if (!key) {
            return res.status(400).json({ message: "File key is required" });
        }

        await deleteFromR2(key);

        res.status(200).json({
            message: "File deleted successfully",
            key
        });

    } catch (error) {
        console.error("Error deleting file:", error);
        res.status(500).json({ message: "Error deleting file from R2" });
    }
};