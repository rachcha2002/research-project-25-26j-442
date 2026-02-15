# PediTrack User Service

A comprehensive microservice for user authentication, authorization, and baby profile management for the PediTrack application.

## Features

### Authentication
- ✅ **Email/Password Authentication** - Secure user registration and login with bcrypt password hashing
- ✅ **JWT Tokens** - Access tokens (15min) and refresh tokens (7days) for secure API access
- ✅ **Google OAuth 2.0** - Sign in with Google integration
- ✅ **Token Refresh** - Automatic token refresh mechanism
- ✅ **Password Management** - Change password functionality with validation

### User Management
- ✅ **User Profiles** - Complete user profile management (name, email, phone, photo)
- ✅ **Account Management** - Update profile, change password, delete account
- ✅ **Email Validation** - Email format validation and uniqueness checks
- ✅ **Secure Password Storage** - Passwords hashed with bcrypt (salt rounds: 10)

### Baby Profile Management
- ✅ **Multiple Baby Profiles** - One user can manage multiple baby profiles
- ✅ **Complete Baby Info** - Name, DOB, gender, photo, blood type, allergies, medical notes
- ✅ **Default Baby Profile** - Set a default/active baby profile per user
- ✅ **Age Calculation** - Automatic age calculation (years, months, days)
- ✅ **CRUD Operations** - Full create, read, update, delete functionality

### Security Features
- ✅ **Request Validation** - Input validation with express-validator
- ✅ **Rate Limiting** - Prevent abuse with configurable rate limits
- ✅ **CORS Protection** - Configurable CORS policies
- ✅ **Helmet Security** - Security headers with helmet.js
- ✅ **JWT Secret Rotation** - Separate secrets for access and refresh tokens

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose ODM)
- **Authentication**: JWT (jsonwebtoken), Passport.js
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit

## Installation

1. **Navigate to the service directory**
   ```bash
   cd services/user-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy the `.env` file and update the values:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_ACCESS_SECRET` - Secret for access tokens (use a strong random string)
   - `JWT_REFRESH_SECRET` - Secret for refresh tokens (use a different strong random string)
   - `GOOGLE_CLIENT_ID` - Google OAuth Client ID (from Google Cloud Console)
   - `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
   - `FRONTEND_URL` - Your frontend application URL

## Running the Service

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The service will start on `http://localhost:5002` by default.

## API Documentation

See [API_DOCS.md](./API_DOCS.md) for complete API reference with examples.

## MongoDB Setup

See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for MongoDB configuration instructions.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5002 |
| `NODE_ENV` | Environment (development/production) | development |
| `MONGODB_URI` | MongoDB connection string | Required |
| `JWT_ACCESS_SECRET` | Secret for access tokens | Required |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Required |
| `JWT_ACCESS_EXPIRE` | Access token expiration | 15m |
| `JWT_REFRESH_EXPIRE` | Refresh token expiration | 7d |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Optional |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL | /api/auth/google/callback |
| `FRONTEND_URL` | Frontend application URL | http://localhost:3000 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | 900000 (15min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## Project Structure

```
user-service/
├── config/
│   └── passport.js          # Passport JWT & Google OAuth strategies
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   └── validation.js        # Request validation middleware
├── models/
│   ├── User.js              # User schema and methods
│   └── BabyProfile.js       # Baby profile schema
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── users.js             # User management endpoints
│   └── babies.js            # Baby profile endpoints
├── utils/
│   └── tokenManager.js      # JWT token utilities
├── .env                     # Environment variables
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies
├── server.js                # Express server setup
├── API_DOCS.md              # API documentation
├── MONGODB_SETUP.md         # MongoDB setup guide
└── README.md                # This file
```

## Integration with Other Services

The User Service is designed to work with other PediTrack microservices:

- **Health Analytics Service** - Baby profiles created here are referenced by health records
- **Frontend Application** - React Native app consumes the authentication and profile APIs

### Using Baby Profiles Across Services

When a baby profile is created, the `_id` can be used in other services:

```javascript
// Example: Creating a health record for a baby
POST /api/health-records
{
  "babyId": "507f1f77bcf86cd799439011",  // From user-service
  "recordType": "measurement",
  // ... other fields
}
```

## License

ISC
