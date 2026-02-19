const mongoose = require('mongoose');

const SleepLogSchema = new mongoose.Schema({
  babyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Baby',
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
    enum: ['good', 'fair', 'poor'],
    default: 'good'
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
