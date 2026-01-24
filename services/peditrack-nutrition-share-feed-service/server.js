const express = require('express');
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

// Middleware to parse JSON bodies
app.use(express.json());

app.use('/api', uploadRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/follow', followRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
