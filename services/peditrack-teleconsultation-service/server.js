require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const teleconsultationRoutes = require('./routes/teleconsultationRoutes');

const app = express();
const port = process.env.PORT || 4001;

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
  res.send('Peditrack Teleconsultation Service is running');
});

app.use('/api/teleconsultation', teleconsultationRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
