const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'senior_manager', 'hr_recruiter', 'employee'],
      default: 'employee',
    },
    employeeId: { type: String, sparse: true, unique: true },
    department: String,
    designation: String,
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    permissions: { type: [String], default: [] },
    joinDate: Date,
    salary: { type: Number, default: 0 },
    profile: {
      phone: String,
      location: String,
      linkedin: String,
      bio: String,
      skills: [String],
      experience: String,
      education: String,
      onboardingComplete: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

module.exports = mongoose.model('User', userSchema);
