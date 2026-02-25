const { s3Client } = require('../Config/Driveconfig');
const { Upload } = require('@aws-sdk/lib-storage');
const path = require('path');
const Doctor = require('../Models/Doctor');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { GetObjectCommand } = require('@aws-sdk/client-s3');

// Manual registration (basic info only)
exports.register = async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ message: 'Doctor already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique doctor_id
    const doctorId = `doc_${Date.now()}`;

    // Create doctor with minimal info, inactive status
    const doctor = new Doctor({
      doctor_id: doctorId,
      email,
      password: hashedPassword,
      first_name,
      last_name,
      auth_provider: 'local',
      account_status: 'Inactive', // Require profile completion to activate
      // Other fields can be filled later
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
      available_time_slots: [],
      verified_at: null,
    });

    await doctor.save();

    // Remove password from response
    const doctorObj = doctor.toObject();
    delete doctorObj.password;

    res.status(201).json({ message: 'Doctor registered successfully. Please complete your profile.', doctor: doctorObj });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Manual login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const doctor = await Doctor.findOne({ email, auth_provider: 'local' });
    if (!doctor) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    if (doctor.account_status === 'Suspended') {
      return res.status(403).json({ message: 'Account is suspended.' });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { doctor_id: doctor.doctor_id, email: doctor.email, role: doctor.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const doctorObj = doctor.toObject();
    delete doctorObj.password;

    res.status(200).json({ message: 'Login successful', token, doctor: doctorObj });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Google OAuth callback handler
exports.googleCallback = (req, res) => {
  const doctor = req.user;
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { doctor_id: doctor.doctor_id, email: doctor.email, role: doctor.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Redirect to frontend with token and doctor info as query params
  const frontendUrl = process.env.FRONTEND_URL;
  const doctorStr = encodeURIComponent(JSON.stringify(doctor));
  res.redirect(`${frontendUrl}/google/callback?token=${token}&doctor=${doctorStr}`);
};

// Complete profile
async function uploadFileToR2(file, folder) {
  const remoteKey = `${folder}/${Date.now()}-${file.originalname}`;
  const uploader = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: remoteKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    },
  });
  const data = await uploader.done();
  console.log('File uploaded to R2:', data);
  return {
    url: data.Location,
    key: remoteKey,
  };
}

exports.completeProfile = async (req, res) => {
  try {
    const doctorId = req.doctor.doctor_id;
    if (!doctorId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const doctor = await Doctor.findOne({ doctor_id: doctorId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Handle file uploads using helper
    let profile_photo_url = doctor.profile_photo_url;
    let medical_license_document_url = doctor.medical_license_document_url;

    if (req.files && req.files.profile_photo) {
      const file = req.files.profile_photo[0];
      const uploadResult = await uploadFileToR2(file, 'profile_photos');
      profile_photo_url = uploadResult.url;
    }

    if (req.files && req.files.medical_license_document) {
      const file = req.files.medical_license_document[0];
      const uploadResult = await uploadFileToR2(file, 'medical_licenses');
      medical_license_document_url = uploadResult.url;
    }

    // Update doctor profile
    const updateFields = {
      ...req.body,
      profile_photo_url,
      medical_license_document_url,
      account_status: 'Active',
      updated_at: new Date(),
    };

    delete updateFields.email;
    delete updateFields.password;
    delete updateFields.auth_provider;

    const updatedDoctor = await Doctor.findOneAndUpdate(
      { doctor_id: doctorId },
      { $set: updateFields },
      { new: true }
    );

    res.json({ message: 'Profile completed successfully', doctor: updatedDoctor });
  } catch (error) {
    res.status(500).json({ message: 'Profile completion failed', error: error.message });
  }
};

// Get doctor file
exports.getDoctorFile = async (req, res) => {
  try {
    const { folder, filename } = req.params;
    const key = `${folder}/${filename}`;
    
    if (!folder || !filename) {
      return res.status(400).json({ message: "File key is required" });
    }
    
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key
    });
    const data = await s3Client.send(command);

    res.setHeader("Content-Type", data.ContentType || "application/octet-stream");
    res.setHeader("Content-Length", data.ContentLength);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${filename}"`
    );
    data.Body.pipe(res);
  } catch (error) {
    console.error("Error retrieving file:", error);
    res.status(500).json({ message: "Error downloading file from R2" });
  }
};