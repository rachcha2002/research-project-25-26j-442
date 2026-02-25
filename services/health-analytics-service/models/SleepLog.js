const mongoose = require('mongoose');

const SleepLogSchema = new mongoose.Schema({
  babyId: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  hours: {
    type: Number,
    required: true
  },
  quality: {
    type: String,
    // Survey Q20 — 5 granular sleep quality categories
    enum: [
      'sleepsWell',              // Sleeps well through the night
      'wakes1-2times',           // Wakes 1–2 times per night
      'wakesFrequently',         // Wakes frequently during the night
      'difficultyFallingAsleep', // Has difficulty falling asleep
      'restless',                // Restless / tosses and turns
    ],
    default: 'sleepsWell',
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Ensure one log per day per baby
SleepLogSchema.index({ babyId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('SleepLog', SleepLogSchema);
