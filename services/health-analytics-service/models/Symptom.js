const mongoose = require('mongoose');

const symptomEntrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe'],
    default: 'mild'
  },
  isCustom: {
    type: Boolean,
    default: false
  }
});

const symptomSchema = new mongoose.Schema({
  babyId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  symptoms: {
    type: [symptomEntrySchema],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one symptom is required'
    }
  },
  recordedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  notes: {
    type: String,
    trim: true
  },
  temperature: {
    type: Number,
    min: 30,
    max: 45
  }
}, {
  timestamps: true
});

// Index for efficient querying by baby and date
symptomSchema.index({ babyId: 1, recordedAt: -1 });

module.exports = mongoose.model('Symptom', symptomSchema);
