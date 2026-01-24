require('dotenv').config();
const connectDB = require('./src/Config/DBConnectivity');

const port = process.env.PORT;

if (typeof connectDB === 'function') {
  connectDB();
} else {
  console.error('ERROR: connectDB is not a function');
}

console.log("Auth User Service Server is running on port " + port);