const express = require('express');
const router = express.Router();
const SleepLog = require('../models/SleepLog');

// @route   GET /api/sleep/:babyId
// @desc    Get sleep logs for a baby
router.get('/:babyId', async (req, res) => {
  try {
    const { babyId } = req.params;
    const { start, end } = req.query; // Expect ISO date strings

    let query = { babyId };

    if (start || end) {
      query.date = {};
      if (start) query.date.$gte = new Date(start);
      if (end) query.date.$lte = new Date(end);
    }

    const logs = await SleepLog.find(query).sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching sleep logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/sleep
// @desc    Log/Update sleep entry (Upsert)
router.post('/', async (req, res) => {
  try {
    const { babyId, date, hours, quality, notes } = req.body;

    // Normalize date to UTC midnight to ensure one-per-day uniqueness
    const logDate = new Date(date);
    logDate.setUTCHours(0, 0, 0, 0);

    const log = await SleepLog.findOneAndUpdate(
      { babyId, date: logDate },
      { hours, quality, notes },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(log);
  } catch (error) {
    console.error('Error saving sleep log:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/sleep/:id
router.delete('/:id', async (req, res) => {
  try {
    await SleepLog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sleep log removed' });
  } catch (error) {
    console.error('Error deleting sleep log:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
