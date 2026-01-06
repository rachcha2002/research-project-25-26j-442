const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  // Reference to baby
  babyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Baby',
    required: true,
    index: true,
  },

  // Measurement date
  measurementDate: {
    type: Date,
    required: true,
    default: Date.now,
  },

  // Growth measurements
  height: {
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      enum: ['cm', 'in'],
      default: 'cm',
    },
  },
  weight: {
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      enum: ['kg', 'lb'],
      default: 'kg',
    },
  },
  headCircumference: {
    value: {
      type: Number,
    },
    unit: {
      type: String,
      enum: ['cm', 'in'],
      default: 'cm',
    },
  },

  // Auto-calculated BMI
  bmi: {
    type: Number,
  },

  // Percentile data
  percentiles: {
    height: Number,
    weight: Number,
    headCircumference: Number,
    bmi: Number,
  },

  // Additional data
  location: {
    type: String,
    trim: true,
    default: 'Home',
  },
  notes: {
    type: String,
    trim: true,
  },
  entryMode: {
    type: String,
    enum: ['manual', 'photo'],
    default: 'manual',
  },

  // Photo reference if entry mode is photo
  photoUrl: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes
measurementSchema.index({ babyId: 1, measurementDate: -1 });

// Pre-save hook to calculate BMI
measurementSchema.pre('save', async function() {
  if (this.height.value && this.weight.value) {
    // Convert height to meters if in cm
    const heightInMeters = this.height.unit === 'cm' 
      ? this.height.value / 100 
      : this.height.value * 0.0254;
    
    // Convert weight to kg if in lb
    const weightInKg = this.weight.unit === 'kg' 
      ? this.weight.value 
      : this.weight.value * 0.453592;
    
    this.bmi = Number((weightInKg / (heightInMeters * heightInMeters)).toFixed(2));
  }
});

module.exports = mongoose.model('Measurement', measurementSchema);
