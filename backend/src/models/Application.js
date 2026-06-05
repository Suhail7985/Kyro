const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    resumeUrl: String,
    resumeText: String,
    extractedName: String,
    extractedEmail: String,
    matchedSkills: [String],
    missingSkills: [String],
    aiFeedback: String,
    matchScore: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    pipelineStatus: {
      type: String,
      enum: ['applied', 'screening', 'shortlisted', 'interview', 'recruiter_review', 'manager_review', 'selected', 'rejected', 'onboarding'],
      default: 'applied',
    },
    status: {
      type: String,
      default: 'applied',
    },
    interviewVideos: [
      {
        questionId: String,
        question: String,
        videoUrl: String,
        videoDuration: Number,
        uploadedAt: { type: Date, default: Date.now },
        videoAnalysis: {
          transcript: String,
          confidenceScore: Number,
          toneAnalysis: String,
          matchingKeywords: [String],
          overallFeedback: String,
        },
      },
    ],
    parsedResume: {
      name: String,
      email: String,
      phone: String,
      location: String,
      summary: String,
      skills: [String],
      workHistory: [{
        company: String,
        title: String,
        startDate: String,
        endDate: String,
        description: String,
      }],
      education: [{
        institution: String,
        degree: String,
        field: String,
        graduationYear: String,
      }],
      certifications: [String],
      languages: [String],
    },
    recruiterFeedback: String,
    recruiterScore: Number,
    recruiterReviewedAt: Date,
    managerFeedback: String,
    managerScore: Number,
    managerReviewedAt: Date,
    isRejected: { type: Boolean, default: false },
    rejectionReason: String,
    isSelected: { type: Boolean, default: false },
    selectedDate: Date,
    convertedToEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    conversionDate: Date,
  },
  { timestamps: true }
);

applicationSchema.pre('save', function (next) {
  if (this.isModified('matchScore')) {
    this.score = this.matchScore;
  } else if (this.isModified('score')) {
    this.matchScore = this.score;
  } else {
    if (this.matchScore !== this.score) {
      this.score = this.matchScore;
    }
  }

  if (this.isModified('pipelineStatus')) {
    this.status = this.pipelineStatus;
  } else if (this.isModified('status')) {
    const s = this.status ? this.status.toLowerCase() : 'applied';
    if (['applied', 'screening', 'shortlisted', 'interview', 'recruiter_review', 'manager_review', 'selected', 'rejected', 'onboarding'].includes(s)) {
      this.pipelineStatus = s;
      this.status = s;
    } else {
      this.pipelineStatus = 'applied';
      this.status = 'applied';
    }
  } else {
    if (this.pipelineStatus !== this.status) {
      this.status = this.pipelineStatus;
    }
  }
  next();
});

applicationSchema.index({ applicantId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ pipelineStatus: 1 });
applicationSchema.index({ jobId: 1, pipelineStatus: 1 });

module.exports = mongoose.model('Application', applicationSchema);
