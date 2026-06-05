import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAttendance extends Document {
  employeeId: Types.ObjectId;
  userId: Types.ObjectId;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'remote';
  hoursWorked: number;
  isLate: boolean;
  notes?: string;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    checkIn: Date,
    checkOut: Date,
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'remote'],
      default: 'present',
    },
    hoursWorked: { type: Number, default: 0 },
    isLate: { type: Boolean, default: false },
    notes: String,
  },
  { timestamps: true }
);

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ employeeId: 1, date: -1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
