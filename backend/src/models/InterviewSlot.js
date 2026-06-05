const mongoose = require('mongoose');

const interviewSlotSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // e.g. '14:00'
    endTime: { type: String, required: true },   // e.g. '14:45'
    duration: { type: Number, default: 45 },      // minutes
    isBooked: { type: Boolean, default: false },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    meetingLink: String,
    calendlyUrl: String,
    status: {
      type: String,
      enum: ['available', 'booked', 'completed', 'cancelled'],
      default: 'available',
    },
  },
  { timestamps: true }
);

interviewSlotSchema.index({ jobId: 1, date: 1, startTime: 1 });
interviewSlotSchema.index({ bookedBy: 1 });

module.exports = mongoose.model('InterviewSlot', interviewSlotSchema);
