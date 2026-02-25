const express = require('express');
const router = express.Router();
const VaccineType = require('../models/VaccineType');

/**
 * GET /vaccine-types - Get all active vaccine types
 */
router.get('/', async (req, res) => {
  try {
    const vaccineTypes = await VaccineType.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 });
    res.json(vaccineTypes);
  } catch (error) {
    console.error('Error fetching vaccine types:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /vaccine-types/:id - Get vaccine type by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const vaccineType = await VaccineType.findById(req.params.id);
    if (!vaccineType) {
      return res.status(404).json({ message: 'Vaccine type not found' });
    }
    res.json(vaccineType);
  } catch (error) {
    console.error('Error fetching vaccine type:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /vaccine-types - Create new vaccine type
 */
router.post('/', async (req, res) => {
  try {
    const vaccineType = new VaccineType(req.body);
    await vaccineType.save();
    res.status(201).json(vaccineType);
  } catch (error) {
    console.error('Error creating vaccine type:', error);
    res.status(400).json({ message: 'Invalid data', error: error.message });
  }
});

/**
 * PUT /vaccine-types/:id - Update vaccine type
 */
router.put('/:id', async (req, res) => {
  try {
    const vaccineType = await VaccineType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!vaccineType) {
      return res.status(404).json({ message: 'Vaccine type not found' });
    }
    res.json(vaccineType);
  } catch (error) {
    console.error('Error updating vaccine type:', error);
    res.status(400).json({ message: 'Invalid data', error: error.message });
  }
});

/**
 * DELETE /vaccine-types/:id - Delete vaccine type (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const vaccineType = await VaccineType.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!vaccineType) {
      return res.status(404).json({ message: 'Vaccine type not found' });
    }
    res.json({ message: 'Vaccine type deleted successfully' });
  } catch (error) {
    console.error('Error deleting vaccine type:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /vaccine-types/seed - Seed database with common vaccines
 */
router.post('/seed', async (req, res) => {
  try {
    const commonVaccines = [
      { name: 'DTaP (Diphtheria, Tetanus, Pertussis)', recommendedDoses: 5, ageRecommendations: '2, 4, 6, 15-18 months, 4-6 years', displayOrder: 1 },
      { name: 'MMR (Measles, Mumps, Rubella)', recommendedDoses: 2, ageRecommendations: '12-15 months, 4-6 years', displayOrder: 2 },
      { name: 'Polio (IPV)', recommendedDoses: 4, ageRecommendations: '2, 4, 6-18 months, 4-6 years', displayOrder: 3 },
      { name: 'Hepatitis B', recommendedDoses: 3, ageRecommendations: 'Birth, 1-2 months, 6-18 months', displayOrder: 4 },
      { name: 'Hepatitis A', recommendedDoses: 2, ageRecommendations: '12-23 months, 18-24 months', displayOrder: 5 },
      { name: 'Hib (Haemophilus influenzae type b)', recommendedDoses: 4, ageRecommendations: '2, 4, 6, 12-15 months', displayOrder: 6 },
      { name: 'Varicella (Chickenpox)', recommendedDoses: 2, ageRecommendations: '12-15 months, 4-6 years', displayOrder: 7 },
      { name: 'PCV (Pneumococcal)', recommendedDoses: 4, ageRecommendations: '2, 4, 6, 12-15 months', displayOrder: 8 },
      { name: 'Rotavirus', recommendedDoses: 3, ageRecommendations: '2, 4, 6 months', displayOrder: 9 },
      { name: 'Influenza (Flu)', recommendedDoses: 1, ageRecommendations: 'Annual, starting at 6 months', displayOrder: 10 },
      { name: 'Meningococcal', recommendedDoses: 2, ageRecommendations: '11-12 years, 16 years', displayOrder: 11 },
      { name: 'HPV (Human Papillomavirus)', recommendedDoses: 2, ageRecommendations: '11-12 years', displayOrder: 12 },
      { name: 'COVID-19', recommendedDoses: 2, ageRecommendations: '6 months+', displayOrder: 13 },
      { name: 'Other', recommendedDoses: 1, ageRecommendations: 'As prescribed', displayOrder: 99 },
    ];

    // Delete existing vaccines before seeding
    await VaccineType.deleteMany({});

    // Insert new vaccines
    const created = await VaccineType.insertMany(commonVaccines);
    res.json({ 
      message: 'Database seeded successfully', 
      count: created.length,
      vaccines: created 
    });
  } catch (error) {
    console.error('Error seeding vaccine types:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
