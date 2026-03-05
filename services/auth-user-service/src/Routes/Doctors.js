const express = require('express');
const passport = require('passport');
const router = express.Router();
const { register, login, googleCallback, completeProfile, getDoctorFile, getDoctorPublicProfile } = require('../Controllers/Doctors');
const upload = require('../Middleware/multer');
const auth = require('../Middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',passport.authenticate('google', { failureRedirect: '/' }),googleCallback);
router.put('/complete-profile',auth,upload.fields([{ name: 'profile_photo', maxCount: 1 },{ name: 'medical_license_document', maxCount: 1 }]),completeProfile);
router.get('/doctor-file/:folder/:filename', getDoctorFile);
router.get('/:doctorId/public', getDoctorPublicProfile);

module.exports = router;