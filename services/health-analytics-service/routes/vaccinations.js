const express = require('express');
const router = express.Router();
const Vaccination = require('../models/Vaccination');

// Get all vaccinations for a baby
router.get('/baby/:babyId', async (req, res) => {
  try {
    const { babyId } = req.params;
    const { status } = req.query;

    let query = { babyId };
    if (status) {
      query.status = status;
    }

    const vaccinations = await Vaccination.find(query).sort({ scheduledDate: -1 });
    res.json(vaccinations);
  } catch (error) {
    console.error('Error fetching vaccinations:', error);
    res.status(500).json({ error: 'Failed to fetch vaccinations' });
  }
});

// Get completed vaccinations for a baby
router.get('/baby/:babyId/completed', async (req, res) => {
  try {
    const { babyId } = req.params;
    const vaccinations = await Vaccination.find({ 
      babyId, 
      status: 'completed' 
    }).sort({ administeredDate: -1 });
    res.json(vaccinations);
  } catch (error) {
    console.error('Error fetching completed vaccinations:', error);
    res.status(500).json({ error: 'Failed to fetch completed vaccinations' });
  }
});

// Get upcoming vaccinations for a baby
router.get('/baby/:babyId/upcoming', async (req, res) => {
  try {
    const { babyId } = req.params;
    const now = new Date();
    const vaccinations = await Vaccination.find({ 
      babyId, 
      status: { $in: ['scheduled', 'overdue'] },
      scheduledDate: { $gte: now }
    }).sort({ scheduledDate: 1 });
    res.json(vaccinations);
  } catch (error) {
    console.error('Error fetching upcoming vaccinations:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming vaccinations' });
  }
});

// Get a single vaccination by ID
router.get('/:id', async (req, res) => {
  try {
    const vaccination = await Vaccination.findById(req.params.id);
    if (!vaccination) {
      return res.status(404).json({ error: 'Vaccination not found' });
    }
    res.json(vaccination);
  } catch (error) {
    console.error('Error fetching vaccination:', error);
    res.status(500).json({ error: 'Failed to fetch vaccination' });
  }
});

// Create a new vaccination record
router.post('/', async (req, res) => {
  try {
    const vaccination = new Vaccination(req.body);
    
    // Auto-update status based on dates
    if (vaccination.administeredDate) {
      vaccination.status = 'completed';
    } else if (vaccination.scheduledDate && vaccination.scheduledDate < new Date()) {
      vaccination.status = 'overdue';
    }
    
    await vaccination.save();
    res.status(201).json(vaccination);
  } catch (error) {
    console.error('Error creating vaccination:', error);
    res.status(400).json({ error: 'Failed to create vaccination' });
  }
});

// Update a vaccination
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Auto-update status based on dates
    if (updateData.administeredDate) {
      updateData.status = 'completed';
    } else if (updateData.scheduledDate && new Date(updateData.scheduledDate) < new Date()) {
      updateData.status = 'overdue';
    }
    
    const vaccination = await Vaccination.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!vaccination) {
      return res.status(404).json({ error: 'Vaccination not found' });
    }
    
    res.json(vaccination);
  } catch (error) {
    console.error('Error updating vaccination:', error);
    res.status(400).json({ error: 'Failed to update vaccination' });
  }
});

// Update vaccination status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['scheduled', 'completed', 'overdue', 'skipped'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const updateData = { status };
    
    // If marking as completed and no administered date, set it to now
    if (status === 'completed') {
      const vaccination = await Vaccination.findById(id);
      if (!vaccination.administeredDate) {
        updateData.administeredDate = new Date();
      }
    }
    
    const vaccination = await Vaccination.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!vaccination) {
      return res.status(404).json({ error: 'Vaccination not found' });
    }
    
    res.json(vaccination);
  } catch (error) {
    console.error('Error updating vaccination status:', error);
    res.status(400).json({ error: 'Failed to update vaccination status' });
  }
});

// Delete a vaccination
router.delete('/:id', async (req, res) => {
  try {
    const vaccination = await Vaccination.findByIdAndDelete(req.params.id);
    if (!vaccination) {
      return res.status(404).json({ error: 'Vaccination not found' });
    }
    res.json({ message: 'Vaccination deleted successfully' });
  } catch (error) {
    console.error('Error deleting vaccination:', error);
    res.status(500).json({ error: 'Failed to delete vaccination' });
  }
});

module.exports = router;
