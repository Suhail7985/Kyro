const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    resumeUrl: String,
    resumeText: String,
    extractedName: String,
    extractedEmail: String,
    matchedSkills: [String],
    missingSkills: [String],
    aiFeedback: String,
    score: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Applied', 'Screening', 'Shortlisted', 'Rejected', 'Interview'],
      default: 'Applied',
    },
    videoUrl: String,
    videoFilename: String,
  },
  { timestamps: true }
);

applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
