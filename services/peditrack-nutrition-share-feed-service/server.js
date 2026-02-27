const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./src/db/DBConnectivity');
const uploadRoutes = require('./src/routes/uploadRoutes');
const postRoutes = require('./src/routes/postRoutes');
const followRoutes = require('./src/routes/followRoutes');

if (typeof connectDB === 'function') {
  connectDB();
} else {
  console.error('ERROR: connectDB is not a function');
}

const app = express();
const port = process.env.PORT;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Add your frontend URLs
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware to parse JSON bodies
app.use(express.json());

app.use('/api', uploadRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/follow', followRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
