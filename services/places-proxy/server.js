const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
const PORT = process.env.PORT || 4001;

// Proxy endpoint for nearby hospitals
app.get('/api/nearby-hospitals', async (req, res) => {
  const { lat, lng } = req.query;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!lat || !lng || !apiKey) {
    return res.status(400).json({ error: 'Missing lat, lng, or API key' });
  }
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=hospital&key=${apiKey}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
