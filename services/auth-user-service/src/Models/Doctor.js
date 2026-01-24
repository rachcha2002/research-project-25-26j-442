const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  doctor_id: { type: String, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  profile_photo_url: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  date_of_birth: { type: Date, required: true },
  email: { type: String, required: true, unique: true },
  phone_number: { type: String, required: true },
  country: { type: String, required: true },
  languages_spoken: [{ type: String }],
  medical_license_number: { type: String, required: true, unique: true },
  license_issuing_authority: { type: String, required: true },
  license_country: { type: String, required: true },
  license_expiry_date: { type: Date, required: true },
  medical_license_document_url: { type: String, required: true },
  specialization: { type: String, required: true },
  verified_at: { type: Date },
  availability_status: { type: String, enum: ['Available', 'Unavailable', 'Busy'], default: 'Unavailable' },
  available_time_slots: [{ type: String }],
  role: { type: String, default: 'doctor' },
  account_status: { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Inactive' },
  total_consultations: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },

  // Google sign up/in fields
  google_id: { type: String, unique: true, sparse: true },
  auth_provider: { type: String, enum: ['local', 'google'], default: 'local' }
});

module.exports = mongoose.model('Doctor', DoctorSchema);