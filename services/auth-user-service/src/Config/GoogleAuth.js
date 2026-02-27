const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Doctor = require('../Models/Doctor');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/doctors/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
  // Find or create doctor
  let doctor = await Doctor.findOne({ google_id: profile.id });
  if (!doctor) {
    // Generate a unique doctor_id (e.g., using Date.now and profile.id)
    const doctorId = `google_${profile.id}_${Date.now()}`;
    doctor = await Doctor.create({
      google_id: profile.id,
      doctor_id: doctorId,
      first_name: profile.name.givenName || 'Google',
      last_name: profile.name.familyName || 'User',
      email: profile.emails?.[0]?.value || '',
      profile_photo_url: profile.photos?.[0]?.value || '',
      auth_provider: 'google',
      gender: 'Other',
      date_of_birth: new Date('1970-01-01'),
      phone_number: 'N/A',
      country: 'N/A',
      languages_spoken: [],
      medical_license_number: 'N/A',
      license_issuing_authority: 'N/A',
      license_country: 'N/A',
      license_expiry_date: new Date('1970-01-01'),
      medical_license_document_url: 'N/A',
      specialization: 'N/A',
      account_status: 'Inactive',
      available_time_slots: [],
      verified_at: null,
      password: '',
      // Other fields will be filled after profile completion
    });
  }
  return done(null, doctor);
}));

passport.serializeUser((doctor, done) => {
  done(null, doctor.id);
});

passport.deserializeUser(async (id, done) => {
  const doctor = await Doctor.findById(id);
  done(null, doctor);
});