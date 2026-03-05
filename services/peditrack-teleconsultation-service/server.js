require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const teleconsultationRoutes = require('./routes/teleconsultationRoutes');

const app = express();
const port = process.env.PORT || 4001;
global.sharedMongoose = mongoose;

mongoose.set('bufferCommands', false);

app.use(cors());
app.use(bodyParser.json());

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Routes
app.get('/', (req, res) => {
  res.send('Peditrack Teleconsultation Service is running');
});

app.use('/api/teleconsultation', teleconsultationRoutes);

startServer();
