const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
const PORT = process.env.PORT || 4002;
const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

const fetchPlaceDetails = async (placeId, apiKey) => {
  const detailsUrl = `${GOOGLE_MAPS_BASE_URL}/place/details/json?place_id=${placeId}&fields=photo,formatted_phone_number,international_phone_number&key=${apiKey}`;
  const detailsResponse = await axios.get(detailsUrl);
  return detailsResponse.data?.result || null;
};

const nearbyHospitalsHandler = async (req, res) => {
  const { lat, lng, radius } = req.query;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!lat || !lng || !apiKey) {
    return res.status(400).json({ error: 'Missing lat, lng, or API key' });
  }
  try {
    const hasRadius = Boolean(radius);
    const rankByDistanceQuery = hasRadius ? '' : '&rankby=distance';
    const radiusQuery = hasRadius ? `&radius=${radius}` : '';
    const url = `${GOOGLE_MAPS_BASE_URL}/place/nearbysearch/json?location=${lat},${lng}${radiusQuery}${rankByDistanceQuery}&type=hospital&key=${apiKey}`;
    const response = await axios.get(url);

    const results = Array.isArray(response.data?.results) ? response.data.results : [];
    const enrichedResults = await Promise.all(
      results.map(async (place) => {
        const hasPhotos = Array.isArray(place?.photos) && place.photos.length > 0;
        if (hasPhotos || !place?.place_id) {
          return place;
        }

        try {
          const details = await fetchPlaceDetails(place.place_id, apiKey);
          return {
            ...place,
            photos: Array.isArray(details?.photos) ? details.photos : place.photos,
            formatted_phone_number:
              details?.formatted_phone_number || details?.international_phone_number || null,
          };
        } catch (detailsError) {
          return place;
        }
      })
    );

    res.json({
      ...response.data,
      results: enrichedResults,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const travelTimesHandler = async (req, res) => {
  const { originLat, originLng, destinations } = req.query;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!originLat || !originLng || !destinations || !apiKey) {
    return res.status(400).json({ error: 'Missing origin, destinations, or API key' });
  }

  try {
    const url = `${GOOGLE_MAPS_BASE_URL}/distancematrix/json?origins=${originLat},${originLng}&destinations=${destinations}&mode=driving&departure_time=now&traffic_model=best_guess&key=${apiKey}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const placePhotoHandler = async (req, res) => {
  const { photoReference, maxwidth } = req.query;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!photoReference || !apiKey) {
    return res.status(400).json({ error: 'Missing photoReference or API key' });
  }

  try {
    const width = maxwidth || 500;
    const url = `${GOOGLE_MAPS_BASE_URL}/place/photo?maxwidth=${width}&photo_reference=${photoReference}&key=${apiKey}`;
    return res.redirect(url);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

app.get('/api/nearby-hospitals', nearbyHospitalsHandler);
app.get('/api/travel-times', travelTimesHandler);
app.get('/api/place-photo', placePhotoHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
  });
}

module.exports = {
  app,
  fetchPlaceDetails,
  nearbyHospitalsHandler,
  travelTimesHandler,
  placePhotoHandler,
};
