const Doctor = require('../Models/Doctor');
const bcrypt = require('bcrypt');

// Manual registration
exports.register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, ...otherFields } = req.body;

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ message: 'Doctor already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create doctor
    const doctor = new Doctor({
      email,
      password: hashedPassword,
      first_name,
      last_name,
      auth_provider: 'local',
      ...otherFields
    });

    await doctor.save();
    res.status(201).json({ message: 'Doctor registered successfully', doctor });
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

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Set session
    req.session.doctorId = doctor._id;

    res.status(200).json({ message: 'Login successful', doctor });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};