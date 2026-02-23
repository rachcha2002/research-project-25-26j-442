const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logging

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/babies', require('./routes/babies'));
app.use('/api/measurements', require('./routes/measurements'));
app.use('/api/health-records', require('./routes/healthRecords'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/vaccinations', require('./routes/vaccinations'));
app.use('/api/vaccine-types', require('./routes/vaccineTypes'));
app.use('/api/symptoms', require('./routes/symptoms'));
app.use('/api/ai-insights', require('./routes/aiInsights'));
app.use('/api/growth-standards', require('./routes/growthStandards'));
app.use('/api/sleep', require('./routes/sleep'));
app.use('/api/health-conditions', require('./routes/healthConditions'));
app.use('/api/nutrition', require('./routes/nutrition'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4, // Force IPv4
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('💡 Tip: Make sure MongoDB Atlas cluster is running and IP is whitelisted');
    process.exit(1);
  }
};

// Start Server
const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Health Analytics Service running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
