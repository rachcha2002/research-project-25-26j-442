const mongoose = require('mongoose');

const babyProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Baby name is required'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },
  photo: {
    type: String,
    default: null
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown'
  },
  allergies: [{
    type: String,
    trim: true
  }],
  medicalNotes: {
    type: String,
    maxlength: [1000, 'Medical notes cannot exceed 1000 characters']
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
babyProfileSchema.index({ userId: 1, createdAt: -1 });

// Virtual for age calculation
babyProfileSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();
  
  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months, days };
});

// Ensure virtuals are included in JSON
babyProfileSchema.set('toJSON', { virtuals: true });
babyProfileSchema.set('toObject', { virtuals: true });

// Pre-save middleware to ensure only one default baby per user
babyProfileSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove default flag from other babies of this user
    await this.constructor.updateMany(
      { 
        userId: this.userId, 
        _id: { $ne: this._id },
        isDefault: true 
      },
      { isDefault: false }
    );
  }
  next();
});

// Pre-delete middleware to prevent deletion if it's the default profile
babyProfileSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  if (this.isDefault) {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(this.userId, { defaultBabyProfile: null });
  }
  next();
});

const BabyProfile = mongoose.model('BabyProfile', babyProfileSchema);

module.exports = BabyProfile;
