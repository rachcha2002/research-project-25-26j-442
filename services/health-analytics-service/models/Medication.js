const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  // Reference to baby
  babyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Baby',
    required: true,
    index: true,
  },

  // Medication details
  name: {
    type: String,
    required: true,
    trim: true,
  },
  dosage: {
    amount: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true, // mg, ml, tablets, etc.
    },
  },
  frequency: {
    type: String,
    required: true,
    trim: true, // "twice daily", "every 8 hours", etc.
  },
  route: {
    type: String,
    enum: ['oral', 'topical', 'injection', 'inhalation', 'other'],
    default: 'oral',
  },

  // Duration
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },

  // Prescription info
  prescribedBy: {
    doctorName: String,
    clinicName: String,
    contactNumber: String,
  },
  prescriptionNumber: {
    type: String,
    trim: true,
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'discontinued'],
    default: 'active',
    index: true,
  },

  // Purpose and notes
  purpose: {
    type: String,
    trim: true,
  },
  sideEffects: [{
    type: String,
    trim: true,
  }],
  notes: {
    type: String,
  },

  // Reminders
  reminderEnabled: {
    type: Boolean,
    default: false,
  },
  reminderTimes: [{
    type: String, // "08:00", "14:00", "20:00"
  }],
  reminderDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  }],

  // Refill tracking
  refillDate: {
    type: Date,
  },
  refillReminder: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
medicationSchema.index({ babyId: 1, status: 1 });
medicationSchema.index({ babyId: 1, startDate: -1 });

// Virtual to check if medication is currently active
medicationSchema.virtual('isCurrentlyActive').get(function() {
  if (this.status !== 'active') return false;
  
  const now = new Date();
  if (now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;
  
  return true;
});

medicationSchema.set('toJSON', { virtuals: true });
medicationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Medication', medicationSchema);
