const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema({
  // Reference to baby
  babyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Baby',
    required: true,
    index: true,
  },

  // Insight metadata
  insightType: {
    type: String,
    enum: ['growth_prediction', 'health_alert', 'recommendation', 'milestone', 'trend_analysis'],
    required: true,
  },
  generatedDate: {
    type: Date,
    default: Date.now,
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },

  // Insight content
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['info', 'low', 'medium', 'high', 'critical'],
    default: 'info',
  },

  // Predictions (for growth predictions)
  predictions: {
    timeframe: String, // "3 months", "6 months", "12 months"
    metrics: {
      height: {
        predicted: Number,
        current: Number,
        change: Number,
        unit: String,
      },
      weight: {
        predicted: Number,
        current: Number,
        change: Number,
        unit: String,
      },
      bmi: {
        predicted: Number,
        current: Number,
      },
    },
    percentileRange: {
      min: Number,
      max: Number,
    },
  },

  // Influence factors
  influenceFactors: [{
    name: String,
    value: Number, // percentage influence
    description: String,
  }],

  // Recommendations
  recommendations: [{
    type: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  }],

  // Trend data
  trendData: {
    metric: String, // "height", "weight", etc.
    direction: {
      type: String,
      enum: ['increasing', 'decreasing', 'stable'],
    },
    velocity: Number, // rate of change
    historical: [{
      date: Date,
      value: Number,
    }],
  },

  // Status and actions
  status: {
    type: String,
    enum: ['active', 'dismissed', 'acted_upon', 'expired'],
    default: 'active',
    index: true,
  },
  userActions: [{
    action: String,
    date: Date,
    notes: String,
  }],

  // Expiry for time-sensitive insights
  expiryDate: {
    type: Date,
  },

  // Related data
  relatedMeasurementIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Measurement',
  }],
  relatedHealthRecordIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthRecord',
  }],
}, {
  timestamps: true,
});

// Indexes
aiInsightSchema.index({ babyId: 1, status: 1, generatedDate: -1 });
aiInsightSchema.index({ babyId: 1, insightType: 1 });
aiInsightSchema.index({ expiryDate: 1 });

// Virtual to check if insight is expired
aiInsightSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

aiInsightSchema.set('toJSON', { virtuals: true });
aiInsightSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('AIInsight', aiInsightSchema);
