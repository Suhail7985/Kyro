const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['annual', 'sick', 'personal'], default: 'annual' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true },
    reason: { type: String, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    managerComment: { type: String },
  },
  { timestamps: true }
);

leaveSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Leave', leaveSchema);
