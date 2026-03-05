require('dotenv').config(); // MUST be first - loads .env before other modules
const dns = require('dns');
// Fix for ISP routers that expose DNS on IPv6 link-local only (fe80::1)
// Node.js c-ares resolver can't reach those, so we use public DNS servers
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const passport = require('./config/passport');

const app = express();

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS for all routes

// Stripe webhook needs raw body - must be BEFORE express.json()
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logging
app.use(limiter); // Apply rate limiting to all requests
app.use(passport.initialize()); // Initialize Passport

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'User Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/babies', require('./routes/babies'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/subscription', require('./routes/subscription'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      error: `A user with this ${field} already exists`
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// MongoDB Connection
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const mongoDirectUri = process.env.MONGODB_URI_DIRECT;

  if (!mongoUri) {
    console.error('❌ MongoDB connection error: MONGODB_URI is not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      family: 4, // Force IPv4
    });
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  } catch (error) {
    const isSrvDnsFailure = error?.code === 'ECONNREFUSED' && error?.message?.includes('querySrv');

    if (isSrvDnsFailure && mongoDirectUri) {
      try {
        console.warn('⚠️  SRV DNS lookup failed, trying MONGODB_URI_DIRECT fallback...');
        await mongoose.connect(mongoDirectUri, {
          family: 4,
        });
        console.log('✅ MongoDB connected successfully using direct URI fallback');
        console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
        return;
      } catch (fallbackError) {
        console.error('❌ MongoDB direct URI fallback failed:', fallbackError.message);
      }
    }

    console.error('❌ MongoDB connection error:', error.message);
    console.error('💡 Tips:');
    console.error('   - Make sure MongoDB Atlas cluster is running');
    console.error('   - Verify your IP is whitelisted in MongoDB Atlas');
    console.error('   - Check your connection string in .env file');
    console.error('   - Ensure network connectivity');
    if (isSrvDnsFailure) {
      console.error('   - SRV DNS lookup failed: try changing DNS to 8.8.8.8 or 1.1.1.1');
      console.error('   - Or add MONGODB_URI_DIRECT in .env (non-SRV mongodb:// URI)');
    }
    process.exit(1);
  }
};

// MongoDB connection event listeners
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Start Server
const PORT = process.env.PORT || 5002;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('🚀 PediTrack User Service');
    console.log('═══════════════════════════════════════════════');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 API Base: http://localhost:${PORT}/api`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  POST   /api/auth/register');
    console.log('  POST   /api/auth/login');
    console.log('  POST   /api/auth/refresh');
    console.log('  POST   /api/auth/logout');
    console.log('  GET    /api/auth/google');
    console.log('  GET    /api/users/me');
    console.log('  PUT    /api/users/me');
    console.log('  DELETE /api/users/me');
    console.log('  GET    /api/babies');
    console.log('  POST   /api/babies');
    console.log('  GET    /api/babies/:id');
    console.log('  PUT    /api/babies/:id');
    console.log('  DELETE /api/babies/:id');
    console.log('  POST   /api/upload/profile-picture');
    console.log('  POST   /api/upload/baby-photo/:babyId');
    console.log('  DELETE /api/upload/profile-picture');
    console.log('  DELETE /api/upload/baby-photo/:babyId');
    console.log('  POST   /api/subscription/create-checkout');
    console.log('  GET    /api/subscription/status');
    console.log('  PUT    /api/subscription/auto-renew');
    console.log('  POST   /api/subscription/pay-now');
    console.log('  POST   /api/subscription/cancel');
    console.log('  POST   /api/subscription/webhook');
    console.log('  POST   /api/subscription/verify-session');
    console.log('═══════════════════════════════════════════════');
    console.log('');
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
