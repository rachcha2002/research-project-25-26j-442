const express = require('express');
const router = express.Router();
const Symptom = require('../models/Symptom');

// Get all symptoms for a baby
router.get('/baby/:babyId', async (req, res) => {
  try {
    const { babyId } = req.params;
    const { startDate, endDate } = req.query;

    let query = { babyId };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.recordedAt = {};
      if (startDate) {
        query.recordedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.recordedAt.$lte = new Date(endDate);
      }
    }

    const symptoms = await Symptom.find(query)
      .sort({ recordedAt: -1 })
      .lean();

    res.json(symptoms);
  } catch (error) {
    console.error('Error fetching symptoms:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get recent symptoms (last 7 days)
router.get('/baby/:babyId/recent', async (req, res) => {
  try {
    const { babyId } = req.params;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const symptoms = await Symptom.find({
      babyId,
      recordedAt: { $gte: sevenDaysAgo }
    })
      .sort({ recordedAt: -1 })
      .lean();

    res.json(symptoms);
  } catch (error) {
    console.error('Error fetching recent symptoms:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single symptom record
router.get('/:id', async (req, res) => {
  try {
    const symptom = await Symptom.findById(req.params.id).lean();
    
    if (!symptom) {
      return res.status(404).json({ message: 'Symptom record not found' });
    }

    res.json(symptom);
  } catch (error) {
    console.error('Error fetching symptom:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new symptom record
router.post('/', async (req, res) => {
  try {
    const { babyId, symptoms, recordedAt, notes, temperature } = req.body;

    // Validation
    if (!babyId) {
      return res.status(400).json({ message: 'Baby ID is required' });
    }

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ message: 'At least one symptom is required' });
    }

    // Validate each symptom entry
    for (const symptom of symptoms) {
      if (!symptom.name) {
        return res.status(400).json({ message: 'Symptom name is required' });
      }
      if (symptom.severity && !['mild', 'moderate', 'severe'].includes(symptom.severity)) {
        return res.status(400).json({ message: 'Invalid severity level' });
      }
    }

    const newSymptom = new Symptom({
      babyId,
      symptoms,
      recordedAt: recordedAt || new Date(),
      notes,
      temperature
    });

    await newSymptom.save();
    res.status(201).json(newSymptom);
  } catch (error) {
    console.error('Error creating symptom:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update symptom record
router.put('/:id', async (req, res) => {
  try {
    const { symptoms, recordedAt, notes, temperature } = req.body;

    // Validation
    if (symptoms) {
      if (!Array.isArray(symptoms) || symptoms.length === 0) {
        return res.status(400).json({ message: 'At least one symptom is required' });
      }

      for (const symptom of symptoms) {
        if (!symptom.name) {
          return res.status(400).json({ message: 'Symptom name is required' });
        }
        if (symptom.severity && !['mild', 'moderate', 'severe'].includes(symptom.severity)) {
          return res.status(400).json({ message: 'Invalid severity level' });
        }
      }
    }

    const updateData = {};
    if (symptoms) updateData.symptoms = symptoms;
    if (recordedAt) updateData.recordedAt = recordedAt;
    if (notes !== undefined) updateData.notes = notes;
    if (temperature !== undefined) updateData.temperature = temperature;

    const updatedSymptom = await Symptom.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedSymptom) {
      return res.status(404).json({ message: 'Symptom record not found' });
    }

    res.json(updatedSymptom);
  } catch (error) {
    console.error('Error updating symptom:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete symptom record
router.delete('/:id', async (req, res) => {
  try {
    const deletedSymptom = await Symptom.findByIdAndDelete(req.params.id);

    if (!deletedSymptom) {
      return res.status(404).json({ message: 'Symptom record not found' });
    }

    res.json({ message: 'Symptom record deleted successfully' });
  } catch (error) {
    console.error('Error deleting symptom:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
