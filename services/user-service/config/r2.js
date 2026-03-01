const { S3Client } = require('@aws-sdk/client-s3');

/**
 * Cloudflare R2 Client Configuration
 * R2 is S3-compatible, so we use the AWS SDK with R2 endpoints
 */

// Validate required environment variables
const validateR2Config = () => {
  const required = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  R2 Upload disabled - Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
};

// Create R2 client only if configuration is complete
let r2Client = null;
const isR2Enabled = validateR2Config();

if (isR2Enabled) {
  r2Client = new S3Client({
    region: 'auto', // R2 uses 'auto' for region
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  
  console.log('✅ Cloudflare R2 client initialized');
} else {
  console.log('ℹ️  File upload functionality will accept URLs only (R2 not configured)');
}

module.exports = {
  r2Client,
  isR2Enabled,
  bucketName: process.env.R2_BUCKET_NAME,
  publicUrl: process.env.R2_PUBLIC_URL || `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev`
};
