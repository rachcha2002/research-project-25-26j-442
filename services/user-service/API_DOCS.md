# User Service API Documentation

Complete API reference for the PediTrack User Service.

**Base URL**: `http://localhost:5002/api`

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Baby Profile Management](#baby-profile-management)
4. [File Upload (Cloudflare R2)](#file-upload-cloudflare-r2)
5. [Error Responses](#error-responses)

---

## Authentication

All protected endpoints require a valid JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Register User

Create a new user account.

**Endpoint**: `POST /auth/register`

**Access**: Public

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Success Response** (201):
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "isEmailVerified": false,
    "createdAt": "2024-01-26T10:30:00.000Z",
    "updatedAt": "2024-01-26T10:30:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation Rules**:
- Email: Valid email format, unique
- Password: Min 6 characters, must contain uppercase, lowercase, and number
- Name: 2-100 characters
- Phone: Optional, valid phone format

---

### Login

Authenticate with email and password.

**Endpoint**: `POST /auth/login`

**Access**: Public

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response** (200):
```json
{
  "message": "Login successful",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "defaultBabyProfile": "507f1f77bcf86cd799439012"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Refresh Token

Get a new access token using a refresh token.

**Endpoint**: `POST /auth/refresh`

**Access**: Public

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Logout

Invalidate the refresh token.

**Endpoint**: `POST /auth/logout`

**Access**: Public

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

---

### Google OAuth Login

Initiate Google OAuth flow.

**Endpoint**: `GET /auth/google`

**Access**: Public

**Usage**: Redirect user to this URL in browser. After authentication, user will be redirected to the callback URL with tokens.

**Callback**: `GET /auth/google/callback`

The callback will redirect to your frontend with tokens:
```
{FRONTEND_URL}/auth/callback?accessToken=...&refreshToken=...
```

---

## User Management

### Get Current User Profile

Get the authenticated user's profile.

**Endpoint**: `GET /users/me`

**Access**: Private (requires authentication)

**Success Response** (200):
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "profilePicture": "https://example.com/photo.jpg",
    "isEmailVerified": false,
    "defaultBabyProfile": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Baby Name",
      "dateOfBirth": "2023-06-15T00:00:00.000Z"
    },
    "createdAt": "2024-01-26T10:30:00.000Z"
  }
}
```

---

### Update User Profile

Update the authenticated user's profile.

**Endpoint**: `PUT /users/me`

**Access**: Private

**Request Body** (all fields optional):
```json
{
  "name": "Jane Doe",
  "phone": "+9876543210",
  "profilePicture": "https://example.com/new-photo.jpg"
}
```

**Success Response** (200):
```json
{
  "message": "Profile updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "Jane Doe",
    "phone": "+9876543210"
  }
}
```

---

### Change Password

Change the authenticated user's password.

**Endpoint**: `PUT /users/change-password`

**Access**: Private

**Request Body**:
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass456"
}
```

**Success Response** (200):
```json
{
  "message": "Password changed successfully. Please login again with your new password."
}
```

**Notes**:
- All refresh tokens are invalidated after password change
- User must login again with new password

---

### Delete User Account

Delete the authenticated user's account and all associated baby profiles.

**Endpoint**: `DELETE /users/me`

**Access**: Private

**Success Response** (200):
```json
{
  "message": "Account deleted successfully"
}
```

**Notes**: This action is irreversible and deletes all user data including baby profiles.

---

### Set Default Baby Profile

Set a baby profile as the user's default.

**Endpoint**: `PUT /users/me/default-baby/:babyId`

**Access**: Private

**URL Parameters**:
- `babyId`: MongoDB ObjectId of the baby profile

**Success Response** (200):
```json
{
  "message": "Default baby profile updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "defaultBabyProfile": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Baby Name"
    }
  }
}
```

---

## Baby Profile Management

### Create Baby Profile

Create a new baby profile for the authenticated user.

**Endpoint**: `POST /babies`

**Access**: Private

**Request Body**:
```json
{
  "name": "Emma Doe",
  "dateOfBirth": "2023-06-15",
  "gender": "female",
  "photo": "https://example.com/baby-photo.jpg",
  "bloodType": "O+",
  "allergies": ["Peanuts", "Dairy"],
  "medicalNotes": "Premature birth, requires regular checkups"
}
```

**Success Response** (201):
```json
{
  "message": "Baby profile created successfully",
  "babyProfile": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "name": "Emma Doe",
    "dateOfBirth": "2023-06-15T00:00:00.000Z",
    "gender": "female",
    "photo": "https://example.com/baby-photo.jpg",
    "bloodType": "O+",
    "allergies": ["Peanuts", "Dairy"],
    "medicalNotes": "Premature birth, requires regular checkups",
    "isDefault": true,
    "age": {
      "years": 0,
      "months": 7,
      "days": 11
    },
    "createdAt": "2024-01-26T10:30:00.000Z"
  }
}
```

**Validation Rules**:
- Name: Required, 2-100 characters
- Date of Birth: Required, cannot be in future
- Gender: Required, one of: male, female, other
- Blood Type: Optional, one of: A+, A-, B+, B-, AB+, AB-, O+, O-, Unknown
- Photo: Optional, must be valid URL
- Allergies: Optional, array of strings
- Medical Notes: Optional, max 1000 characters

**Notes**: First baby profile created is automatically set as default.

---

### Get All Baby Profiles

Get all baby profiles for the authenticated user.

**Endpoint**: `GET /babies`

**Access**: Private

**Success Response** (200):
```json
{
  "count": 2,
  "babyProfiles": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Emma Doe",
      "dateOfBirth": "2023-06-15T00:00:00.000Z",
      "gender": "female",
      "isDefault": true,
      "age": {
        "years": 0,
        "months": 7,
        "days": 11
      }
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Liam Doe",
      "dateOfBirth": "2021-03-20T00:00:00.000Z",
      "gender": "male",
      "isDefault": false,
      "age": {
        "years": 2,
        "months": 10,
        "days": 6
      }
    }
  ]
}
```

---

### Get Single Baby Profile

Get a specific baby profile.

**Endpoint**: `GET /babies/:id`

**Access**: Private

**URL Parameters**:
- `id`: MongoDB ObjectId of the baby profile

**Success Response** (200):
```json
{
  "babyProfile": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "name": "Emma Doe",
    "dateOfBirth": "2023-06-15T00:00:00.000Z",
    "gender": "female",
    "photo": "https://example.com/baby-photo.jpg",
    "bloodType": "O+",
    "allergies": ["Peanuts", "Dairy"],
    "medicalNotes": "Premature birth",
    "isDefault": true,
    "age": {
      "years": 0,
      "months": 7,
      "days": 11
    }
  }
}
```

---

### Update Baby Profile

Update a baby profile.

**Endpoint**: `PUT /babies/:id`

**Access**: Private

**URL Parameters**:
- `id`: MongoDB ObjectId of the baby profile

**Request Body** (all fields optional):
```json
{
  "name": "Emma Jane Doe",
  "bloodType": "O+",
  "allergies": ["Peanuts"],
  "medicalNotes": "Updated medical notes"
}
```

**Success Response** (200):
```json
{
  "message": "Baby profile updated successfully",
  "babyProfile": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Emma Jane Doe",
    "bloodType": "O+",
    "allergies": ["Peanuts"]
  }
}
```

---

### Delete Baby Profile

Delete a baby profile.

**Endpoint**: `DELETE /babies/:id`

**Access**: Private

**URL Parameters**:
- `id`: MongoDB ObjectId of the baby profile

**Success Response** (200):
```json
{
  "message": "Baby profile deleted successfully",
  "newDefaultBabyId": "507f1f77bcf86cd799439013"
}
```

**Notes**:
- If deleted baby was the default, another baby is automatically set as default
- `newDefaultBabyId` is null if there are no other babies

---

### Set Baby as Default

Set a baby profile as the default.

**Endpoint**: `PUT /babies/:id/set-default`

**Access**: Private

**URL Parameters**:
- `id`: MongoDB ObjectId of the baby profile

**Success Response** (200):
```json
{
  "message": "Default baby profile set successfully",
  "babyProfile": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Emma Doe",
    "isDefault": true
  }
}
```

---

## File Upload (Cloudflare R2)

Upload profile pictures and baby photos to Cloudflare R2 object storage.

**Prerequisites**: R2 must be configured. See [R2_SETUP.md](./R2_SETUP.md) for setup instructions.

### Upload Profile Picture

Upload or update the authenticated user's profile picture.

**Endpoint**: `POST /upload/profile-picture`

**Access**: Private

**Content-Type**: `multipart/form-data`

**Form Data**:
- `image`: Image file (JPEG, PNG, WebP, GIF)
- Max size: 5 MB

**Success Response** (200):
```json
{
  "message": "Profile picture uploaded successfully",
  "imageUrl": "https://pub-xxxxx.r2.dev/profile-pictures/uuid.jpg",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "profilePicture": "https://pub-xxxxx.r2.dev/profile-pictures/uuid.jpg"
  }
}
```

**Example (cURL)**:
```bash
curl -X POST http://localhost:5002/api/upload/profile-picture \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "image=@/path/to/photo.jpg"
```

**Example (JavaScript/FormData)**:
```javascript
const formData = new FormData();
formData.append('image', file); // file is a File or Blob object

const response = await fetch('http://localhost:5002/api/upload/profile-picture', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});

const data = await response.json();
console.log('Image URL:', data.imageUrl);
```

---

### Upload Baby Photo

Upload or update a baby profile photo.

**Endpoint**: `POST /upload/baby-photo/:babyId`

**Access**: Private

**URL Parameters**:
- `babyId`: MongoDB ObjectId of the baby profile

**Content-Type**: `multipart/form-data`

**Form Data**:
- `image`: Image file (JPEG, PNG, WebP, GIF)
- Max size: 5 MB

**Success Response** (200):
```json
{
  "message": "Baby photo uploaded successfully",
  "imageUrl": "https://pub-xxxxx.r2.dev/baby-photos/uuid.jpg",
  "babyProfile": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Emma Doe",
    "photo": "https://pub-xxxxx.r2.dev/baby-photos/uuid.jpg"
  }
}
```

**Example (cURL)**:
```bash
curl -X POST http://localhost:5002/api/upload/baby-photo/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "image=@/path/to/baby-photo.jpg"
```

**Notes**:
- Automatically deletes old photo from R2 if it exists
- Photo is automatically associated with the baby profile

---

### Delete Profile Picture

Delete the authenticated user's profile picture from R2.

**Endpoint**: `DELETE /upload/profile-picture`

**Access**: Private

**Success Response** (200):
```json
{
  "message": "Profile picture deleted successfully"
}
```

**Example (cURL)**:
```bash
curl -X DELETE http://localhost:5002/api/upload/profile-picture \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Delete Baby Photo

Delete a baby profile photo from R2.

**Endpoint**: `DELETE /upload/baby-photo/:babyId`

**Access**: Private

**URL Parameters**:
- `babyId`: MongoDB ObjectId of the baby profile

**Success Response** (200):
```json
{
  "message": "Baby photo deleted successfully"
}
```

**Example (cURL)**:
```bash
curl -X DELETE http://localhost:5002/api/upload/baby-photo/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### File Upload Specifications

**Supported Formats**:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

**File Size Limit**: 5 MB maximum

**Error Responses**:

**400 Bad Request** - Invalid file type:
```json
{
  "error": "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed."
}
```

**400 Bad Request** - File too large:
```json
{
  "error": "File too large. Maximum size is 5MB."
}
```

**503 Service Unavailable** - R2 not configured:
```json
{
  "error": "File upload is not available. R2 storage is not configured."
}
```

---

### React Native Example

```typescript
// Pick image using expo-image-picker
import * as ImagePicker from 'expo-image-picker';

const uploadProfilePicture = async () => {
  // Pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return;

  // Create form data
  const formData = new FormData();
  formData.append('image', {
    uri: result.assets[0].uri,
    type: 'image/jpeg',
    name: 'profile.jpg',
  } as any);

  // Upload
  const token = await SecureStore.getItemAsync('accessToken');
  const response = await fetch('http://localhost:5002/api/upload/profile-picture', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  console.log('Uploaded image URL:', data.imageUrl);
  
  return data.imageUrl;
};
```

---

## Error Responses

### Common Error Codes

**400 Bad Request** - Validation error or invalid input
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

**401 Unauthorized** - Missing, invalid, or expired token
```json
{
  "error": "Token expired",
  "code": "TOKEN_EXPIRED"
}
```

**404 Not Found** - Resource not found
```json
{
  "error": "Baby profile not found"
}
```

**429 Too Many Requests** - Rate limit exceeded
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

**500 Internal Server Error** - Server error
```json
{
  "error": "Internal server error"
}
```

---

## Example Usage

### Using cURL

**Register a new user**:
```bash
curl -X POST http://localhost:5002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "name": "Test User"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

**Get user profile** (with authentication):
```bash
curl -X GET http://localhost:5002/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Create baby profile**:
```bash
curl -X POST http://localhost:5002/api/babies \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Baby Name",
    "dateOfBirth": "2023-06-15",
    "gender": "female"
  }'
```

---

## Token Management

### Access Token
- **Expiration**: 15 minutes (configurable)
- **Use**: Include in Authorization header for all protected endpoints
- **When expired**: Use refresh token to get a new access token

### Refresh Token
- **Expiration**: 7 days (configurable)
- **Use**: Call `/api/auth/refresh` to get new access token
- **Storage**: Store securely on client (e.g., secure storage on mobile)
- **Revocation**: Invalidated on logout or password change

### Token Flow
1. User logs in → Receives access + refresh tokens
2. Use access token for API calls
3. When access token expires → Use refresh token to get new access token
4. When refresh token expires → User must login again

---

## Integration Examples

### React Native/TypeScript

```typescript
// Login and store tokens
const login = async (email: string, password: string) => {
  const response = await fetch('http://localhost:5002/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  // Store tokens securely (e.g., AsyncStorage or SecureStore)
  await SecureStore.setItemAsync('accessToken', data.tokens.accessToken);
  await SecureStore.setItemAsync('refreshToken', data.tokens.refreshToken);
  
  return data.user;
};

// Make authenticated request
const getUserProfile = async () => {
  const token = await SecureStore.getItemAsync('accessToken');
  
  const response = await fetch('http://localhost:5002/api/users/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 401) {
    // Token expired, refresh it
    await refreshAccessToken();
    return getUserProfile(); // Retry
  }
  
  return response.json();
};

// Refresh token
const refreshAccessToken = async () => {
  const refreshToken = await SecureStore.getItemAsync('refreshToken');
  
  const response = await fetch('http://localhost:5002/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  const data = await response.json();
  await SecureStore.setItemAsync('accessToken', data.accessToken);
};
```
