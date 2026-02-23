const express = require('express');
const router = express.Router();
const FeedingLog = require('../models/FeedingLog');

/**
 * POST /api/nutrition/log
 * Create or update a feeding log for a given day (upsert).
 */
router.post('/log', async (req, res, next) => {
  try {
    const { babyId, date, ...fields } = req.body;

    if (!babyId || !date) {
      return res.status(400).json({ error: 'babyId and date are required' });
    }

    // Normalise date to midnight UTC so one-per-day index works regardless of time
    const normDate = new Date(date);
    normDate.setUTCHours(0, 0, 0, 0);

    const log = await FeedingLog.findOneAndUpdate(
      { babyId, date: normDate },
      { babyId, date: normDate, ...fields },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/nutrition/log/:babyId
 * All feeding logs for a baby, newest first.
 */
router.get('/log/:babyId', async (req, res, next) => {
  try {
    const logs = await FeedingLog.find({ babyId: req.params.babyId }).sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/nutrition/log/:babyId/:year/:month
 * Feeding logs for a specific month (for calendar view).
 * month is 1-indexed (1=Jan, 12=Dec).
 */
router.get('/log/:babyId/:year/:month', async (req, res, next) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month) - 1; // JS months are 0-indexed

    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

    const logs = await FeedingLog.find({
      babyId: req.params.babyId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    res.json(logs);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/nutrition/log/:id
 * Delete a feeding log entry.
 */
router.delete('/log/:id', async (req, res, next) => {
  try {
    const log = await FeedingLog.findByIdAndDelete(req.params.id);
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }
    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
