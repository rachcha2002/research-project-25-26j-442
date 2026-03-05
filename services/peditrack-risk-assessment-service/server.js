require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const assessmentRoutes = require('./routes/assessmentRoutes');
global.sharedMongoose = mongoose;
const teleconsultationRoutes = require('../peditrack-teleconsultation-service/routes/teleconsultationRoutes');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
  res.send('Peditrack Risk Assessment Service is running');
});

app.use('/api', assessmentRoutes);
app.use('/api/teleconsultation', teleconsultationRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
