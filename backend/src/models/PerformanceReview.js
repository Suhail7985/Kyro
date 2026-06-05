const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    period: { type: String, required: true },
    goals: [String],
    achievements: String,
    rating: { type: Number, min: 1, max: 5 },
    feedback: String,
    aiSummary: String,
    aiRecommendations: [String],
    status: { type: String, enum: ['draft', 'submitted', 'approved'], default: 'draft' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PerformanceReview', performanceSchema);
