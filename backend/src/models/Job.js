const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    requiredSkills: [{ type: String }],
    location: String,
    salary: String,
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
