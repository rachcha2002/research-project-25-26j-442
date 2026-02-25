const mongoose = require('mongoose');

const vaccinationSchema = new mongoose.Schema({
  babyId: {
    type: String,
    required: true,
    index: true,
  },
  vaccineName: {
    type: String,
    required: true,
  },
  vaccineType: {
    type: String, // e.g., 'DTaP', 'MMR', 'Polio', 'Hepatitis B', etc.
  },
  doseNumber: {
    type: Number,
    default: 1,
  },
  totalDoses: {
    type: Number,
    default: 1,
  },
  scheduledDate: {
    type: Date,
  },
  administeredDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'overdue', 'skipped'],
    default: 'scheduled',
  },
  location: {
    clinic: String,
    address: String,
  },
  provider: {
    name: String,
    contact: String,
  },
  batchNumber: String,
  notes: String,
  sideEffects: [String],
}, {
  timestamps: true,
});

// Index for efficient queries
vaccinationSchema.index({ babyId: 1, status: 1 });
vaccinationSchema.index({ babyId: 1, scheduledDate: 1 });

module.exports = mongoose.model('Vaccination', vaccinationSchema);
