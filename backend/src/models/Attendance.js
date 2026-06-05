const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    checkIn: Date,
    checkOut: Date,
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'remote'],
      default: 'present',
    },
    hoursWorked: { type: Number, default: 0 },
    notes: String,
    aiFlag: { type: String, enum: ['normal', 'anomaly', 'review'], default: 'normal' },
    checkInLocation: {
      lat: Number,
      lng: Number,
    },
    checkInIP: String,
    locationMethod: {
      type: String,
      enum: ['gps', 'ip', 'bypass', 'remote'],
      default: 'bypass',
    },
    locationVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
