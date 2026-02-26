const mongoose = require('mongoose');

/**
 * FeedingLog Model — Survey Q14–Q18 (Current Nutrition)
 * One log entry per baby per day. All fields are optional
 * so parents can log partially and come back to fill in more.
 */
const feedingLogSchema = new mongoose.Schema(
  {
    babyId: {
      type: String,
      required: [true, 'Baby ID is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },

    // Q14a — Rice (cups per day)
    ricePortions: {
      type: String,
      enum: ['0', '0.5', '1', '1.5', '2', '2.5', '3', '3plus'],
      default: null,
    },

    // Q14b — Other carbohydrates
    otherCarbs: {
      type: String,
      enum: ['bread', 'roti', 'stringHoppers', 'combination', 'rarely'],
      default: null,
    },

    // Q15a — Fish / Meat / Chicken
    proteinMeat: {
      type: String,
      enum: ['never', '1small', '2to3', '3plus'],
      default: null,
    },

    // Q15b — Eggs per week
    eggsPerWeek: {
      type: String,
      enum: ['none', '1to2', '3to5', '6to7', '7plus'],
      default: null,
    },

    // Q15c — Dhal / Lentils
    lentils: {
      type: String,
      enum: ['daily', '3to5perWeek', '1to2perWeek', 'rarely'],
      default: null,
    },

    // Q16a — Milk intake per day
    milkCups: {
      type: String,
      enum: ['none', 'lessThan1', '1to2', '2to3', '3plus'],
      default: null,
    },

    // Q16b — Other dairy (yogurt / curd / cheese)
    otherDairy: {
      type: String,
      enum: ['daily', 'fewPerWeek', 'rarely', 'never'],
      default: null,
    },

    // Q17a — Fruit servings per day
    fruitServings: {
      type: String,
      enum: ['none', '1', '2', '3plus'],
      default: null,
    },

    // Q17b — Vegetable servings per day
    vegServings: {
      type: String,
      enum: ['none', 'with1meal', 'with2meals', 'withAllMeals'],
      default: null,
    },

    // Q18 — Supplements (multi-select)
    supplements: {
      type: [String],
      enum: ['multivitamin', 'vitaminD', 'iron', 'other', 'none'],
      default: ['none'],
    },

    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One log per baby per day
feedingLogSchema.index({ babyId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('FeedingLog', feedingLogSchema);
