const mongoose = require('mongoose');

const TeleconsultationRequestSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  patient: {
    name: String,
    userId: String,
    age_months: Number,
    weight_kg: Number,
    assessment_id: String, 
  },
  risk_level: { type: String, enum: ['low', 'medium', 'high'], required: true },
  risk_priority: { type: Number, min: 0, default: 0 },
  risk_score: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'completed', 'cancelled'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  videoRoom: { type: String },
  doctorId: { type: String }, 
});

module.exports = mongoose.models.TeleconsultationRequest || mongoose.model('TeleconsultationRequest', TeleconsultationRequestSchema);
