require('dotenv').config();
const connectDB = require('./src/Config/DBConnectivity');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('./src/Config/GoogleAuth'); // Import GoogleAuth config

const doctorRoutes = require('./src/Routes/Doctors');
const app = express();

const port = process.env.PORT;

if (typeof connectDB === 'function') {
  connectDB();
} else {
  console.error('ERROR: connectDB is not a function');
}

app.use(cors());
app.use(express.json());
app.use(session({ secret: 'your_secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/doctors', doctorRoutes);

app.listen(port, () => {
  console.log("Auth User Service Server is running on port " + port);
});