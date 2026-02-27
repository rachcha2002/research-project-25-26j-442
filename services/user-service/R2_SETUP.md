# Cloudflare R2 Setup Guide

Complete guide for setting up Cloudflare R2 object storage for PediTrack user and baby profile photos.

## What is Cloudflare R2?

Cloudflare R2 is an S3-compatible object storage service with **zero egress fees**. Perfect for storing images, videos, and files.

### Benefits
- ✅ **Zero egress fees** - No charges for downloading/serving files
- ✅ **S3-compatible** - Works with AWS SDK
- ✅ **10 GB free** - Generous free tier
- ✅ **Global CDN** - Fast delivery worldwide
- ✅ **Simple pricing** - $0.015/GB storage

---

## Step 1: Create Cloudflare Account

1. Go to [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Sign up or log in
3. Verify your email address

---

## Step 2: Create R2 Bucket

1. In the Cloudflare dashboard, select **R2** from the sidebar
2. Click **"Create bucket"**
3. **Bucket name**: `peditrack-uploads` (or your preferred name)
4. **Location**: Automatic (Cloudflare will optimize)
5. Click **"Create bucket"**

---

## Step 3: Configure Public Access

To allow public access to uploaded images:

1. Go to your bucket (`peditrack-uploads`)
2. Click **"Settings"** tab
3. Scroll to **"Public access"**
4. Click **"Allow Access"** or **"Connect Domain"**

### Option A: R2.dev Subdomain (Easiest)
1. Click **"Allow Access"**
2. Cloudflare will generate a public URL like: `https://pub-xxxxxxxxxxxxx.r2.dev`
3. Copy this URL - you'll need it for the `.env` file

### Option B: Custom Domain (Advanced)
1. Click **"Connect Domain"**
2. Enter your custom domain (e.g., `cdn.peditrack.com`)
3. Follow Cloudflare's instructions to set up DNS
4. Use your custom domain URL in `.env`

---

## Step 4: Create API Token

1. Go to **R2** → **Manage R2 API Tokens**
2. Click **"Create API token"**
3. **Token Name**: `peditrack-api-token`
4. **Permissions**: 
   - Object Read & Write
   - (Select your `peditrack-uploads` bucket)
5. Click **"Create API Token"**
6. **Important**: Copy the credentials shown:
   - **Access Key ID** (starts with a random string)
   - **Secret Access Key** (longer random string)
   - **Account ID** (your Cloudflare account ID)
   
   ⚠️ **Save these immediately** - Secret key is shown only once!

---

## Step 5: Configure Environment Variables

Update your `.env` file in the user-service:

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-account-id-here
R2_ACCESS_KEY_ID=your-access-key-id-here
R2_SECRET_ACCESS_KEY=your-secret-access-key-here
R2_BUCKET_NAME=peditrack-uploads
R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxx.r2.dev
```

### Example:
```env
R2_ACCOUNT_ID=a1b2c3d4e5f6g7h8i9j0
R2_ACCESS_KEY_ID=1a2b3c4d5e6f7g8h9i0j
R2_SECRET_ACCESS_KEY=AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCd
R2_BUCKET_NAME=peditrack-uploads
R2_PUBLIC_URL=https://pub-a1b2c3d4.r2.dev
```

---

## Step 6: Restart the Service

After updating `.env`:

```bash
# Restart the service (nodemon will auto-reload)
# Or manually:
npm run dev
```

You should see:
```
✅ Cloudflare R2 client initialized
```

If R2 is not configured, you'll see:
```
ℹ️  File upload functionality will accept URLs only (R2 not configured)
```

---

## Testing File Upload

### Using cURL

**Upload Profile Picture:**
```bash
curl -X POST http://localhost:5002/api/upload/profile-picture \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "image=@/path/to/photo.jpg"
```

**Upload Baby Photo:**
```bash
curl -X POST http://localhost:5002/api/upload/baby-photo/BABY_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "image=@/path/to/baby-photo.jpg"
```

### Using Postman/Thunder Client

1. Set request to `POST`
2. URL: `http://localhost:5002/api/upload/profile-picture`
3. **Headers**: 
   - `Authorization: Bearer YOUR_ACCESS_TOKEN`
4. **Body**: 
   - Select `form-data`
   - Add key: `image` (type: File)
   - Choose your image file
5. Send request

**Expected Response:**
```json
{
  "message": "Profile picture uploaded successfully",
  "imageUrl": "https://pub-xxxxx.r2.dev/profile-pictures/uuid.jpg",
  "user": { ... }
}
```

---

## File Upload Specifications

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

### File Size Limit
- **Maximum**: 5 MB per file

### Storage Structure
```
peditrack-uploads/
├── profile-pictures/
│   ├── uuid-1.jpg
│   ├── uuid-2.png
│   └── ...
└── baby-photos/
    ├── uuid-1.jpg
    ├── uuid-2.jpg
    └── ...
```

---

## API Endpoints

### Upload Profile Picture
```
POST /api/upload/profile-picture
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
  image: (file)
```

### Upload Baby Photo
```
POST /api/upload/baby-photo/:babyId
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
  image: (file)
```

### Delete Profile Picture
```
DELETE /api/upload/profile-picture
Authorization: Bearer {token}
```

### Delete Baby Photo
```
DELETE /api/upload/baby-photo/:babyId
Authorization: Bearer {token}
```

---

## Pricing (as of 2024)

### Free Tier
- **Storage**: 10 GB/month
- **Class A Operations**: 1 million/month (uploads, lists)
- **Class B Operations**: 10 million/month (downloads)

### Paid Tier
- **Storage**: $0.015 per GB/month
- **Class A Operations**: $4.50 per million
- **Class B Operations**: $0.36 per million
- **Egress**: **FREE** (unlike AWS S3!)

---

## Troubleshooting

### Error: "R2 is not configured"
- Check that all R2 environment variables are set in `.env`
- Restart the service after updating `.env`

### Error: "Access Denied"
- Verify API token has correct permissions
- Check bucket name matches in `.env`
- Ensure public access is enabled on bucket

### Error: "File too large"
- Maximum file size is 5 MB
- Compress image or reduce resolution

### Images not publicly accessible
- Enable public access on R2 bucket (Settings → Public Access)
- Use the R2.dev subdomain or custom domain
- Verify `R2_PUBLIC_URL` is correct

---

## Security Best Practices

### For Production

1. **Use Custom Domain** - Instead of R2.dev subdomain
2. **Enable CORS** - Configure allowed origins in R2 settings
3. **Rotate API Keys** - Regularly rotate access keys
4. **Monitor Usage** - Set up usage alerts in Cloudflare
5. **Backup Important Files** - Keep backups of critical images
6. **Use Environment Variables** - Never commit secrets to git

### CORS Configuration (Optional)

In R2 bucket settings, configure CORS:

```json
[
  {
    "AllowedOrigins": ["https://yourapp.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## Additional Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [AWS S3 SDK Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [Multer Documentation](https://github.com/expressjs/multer)

---

## Quick Reference

### Environment Variables
```env
R2_ACCOUNT_ID=           # Your Cloudflare account ID
R2_ACCESS_KEY_ID=        # R2 API token access key
R2_SECRET_ACCESS_KEY=    # R2 API token secret key
R2_BUCKET_NAME=          # Your R2 bucket name
R2_PUBLIC_URL=           # Public URL (R2.dev or custom domain)
```

### Upload Endpoints
- `POST /api/upload/profile-picture` - Upload user profile picture
- `POST /api/upload/baby-photo/:babyId` - Upload baby photo
- `DELETE /api/upload/profile-picture` - Delete user profile picture
- `DELETE /api/upload/baby-photo/:babyId` - Delete baby photo

### File Requirements
- **Formats**: JPEG, PNG, WebP, GIF
- **Max Size**: 5 MB
- **Field Name**: `image` (form-data)
