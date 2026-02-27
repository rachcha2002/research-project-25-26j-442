const mongoose = require('mongoose');

const babySchema = new mongoose.Schema({
  // Account linkage
  accountId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },

  // Basic information
  name: {
    type: String,
    required: true,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true,
  },

  // Parent/Guardian information
  parentName: {
    type: String,
    trim: true,
  },
  parentEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  parentPhone: {
    type: String,
    trim: true,
  },

  // Additional info
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
    default: '',
  },
  allergies: [{
    type: String,
    trim: true,
  }],
  photo: {
    type: String, // URL or base64
  },
  notes: {
    type: String,
  },

  // Birth & prematurity data (Survey Q5a, Q5b)
  birthWeight: {
    type: Number, // in kg
    min: 0.3,
    max: 8,
  },
  isPremature: {
    type: Boolean,
    default: null, // null = not answered, false = full term, true = premature
  },
  gestationalWeeks: {
    type: Number, // e.g. 34 for 34 weeks
    min: 20,
    max: 44,
  },

  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
babySchema.index({ accountId: 1, isActive: 1 });
babySchema.index({ userId: 1, isActive: 1 });

// Virtual for age calculation
babySchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
  months -= birthDate.getMonth();
  months += today.getMonth();
  return months <= 0 ? 0 : months;
});

// Include virtuals in JSON
babySchema.set('toJSON', { virtuals: true });
babySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Baby', babySchema);
