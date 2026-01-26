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
    doctor = await Doctor.create({
      google_id: profile.id,
      first_name: profile.name.givenName,
      last_name: profile.name.familyName,
      email: profile.emails[0].value,
      profile_photo_url: profile.photos[0].value,
      auth_provider: 'google'
      // Other required fields should be filled later
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