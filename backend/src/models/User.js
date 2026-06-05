const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'senior_manager', 'hr_recruiter', 'employee', 'applicant'],
      default: 'employee',
    },
    employeeId: { type: String, sparse: true, unique: true },
    department: String,
    designation: String,
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    permissions: { type: [String], default: [] },
    joinDate: Date,
    salary: { type: Number, default: 0 },
    accountStatus: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    profile: {
      phone: String,
      location: String,
      linkedin: String,
      portfolio: String,
      bio: String,
      skills: [String],
      experience: String,
      education: String,
      onboardingComplete: { type: Boolean, default: false },
    },
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
    conversionStatus: {
      type: String,
      enum: ['applicant', 'selected', 'employee'],
      default: 'applicant',
    },
    convertedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    convertedDate: Date,
    lastLogin: Date,
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    mfaEnabled: { type: Boolean, default: false },
    mfaCode: String,
    mfaCodeExpires: Date,
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

module.exports = mongoose.model('User', userSchema);
