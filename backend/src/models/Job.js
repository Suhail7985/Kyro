const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    department: String,
    description: { type: String, required: true },
    responsibilities: [String],
    requirements: [String],
    requiredSkills: [String],
    niceToHaveSkills: [String],
    experienceRequired: { type: Number, default: 0 },
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'lead'],
      default: 'mid',
    },
    location: String,
    workType: {
      type: String,
      enum: ['remote', 'onsite', 'hybrid'],
      default: 'hybrid',
    },
    salaryMin: Number,
    salaryMax: Number,
    currency: { type: String, default: 'USD' },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship'],
      default: 'full-time',
    },
    benefits: [String],
    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'filled'],
      default: 'open',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    applicantCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    interviewQuestions: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
