const express = require('express');
require('dotenv').config();
const connectDB = require('./src/db/DBConnectivity');

if (typeof connectDB === 'function') {
  connectDB();
} else {
  console.error('ERROR: connectDB is not a function');
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
