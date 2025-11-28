const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  // Reference to baby
  babyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Baby',
    required: true,
    index: true,
  },

  // Record date
  recordDate: {
    type: Date,
    required: true,
    default: Date.now,
  },

  // Health metrics
  temperature: {
    value: Number,
    unit: {
      type: String,
      enum: ['C', 'F'],
      default: 'C',
    },
  },
  bloodPressure: {
    systolic: Number,
    diastolic: Number,
  },
  heartRate: {
    type: Number, // bpm
  },
  respiratoryRate: {
    type: Number, // breaths per minute
  },
  oxygenSaturation: {
    type: Number, // percentage
  },

  // Clinical information
  symptoms: [{
    type: String,
    trim: true,
  }],
  diagnosis: {
    type: String,
    trim: true,
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe', ''],
    default: '',
  },

  // Medical professional info
  doctorName: {
    type: String,
    trim: true,
  },
  clinicName: {
    type: String,
    trim: true,
  },
  doctorNotes: {
    type: String,
  },

  // Attachments
  attachments: [{
    name: String,
    url: String,
    type: String, // pdf, image, etc.
  }],

  // Additional notes
  notes: {
    type: String,
  },

  // Record type
  recordType: {
    type: String,
    enum: ['checkup', 'illness', 'vaccination', 'emergency', 'other'],
    default: 'checkup',
  },
}, {
  timestamps: true,
});

// Indexes
healthRecordSchema.index({ babyId: 1, recordDate: -1 });
healthRecordSchema.index({ babyId: 1, recordType: 1 });

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
