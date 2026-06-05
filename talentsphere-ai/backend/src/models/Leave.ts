import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILeave extends Document {
  employeeId: Types.ObjectId;
  userId: Types.ObjectId;
  type: 'annual' | 'sick' | 'personal' | 'unpaid';
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: Types.ObjectId;
  rejectionReason?: string;
}

const leaveSchema = new Schema<ILeave>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['annual', 'sick', 'personal', 'unpaid'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: String,
  },
  { timestamps: true }
);

leaveSchema.index({ userId: 1, status: 1 });

export const Leave = mongoose.model<ILeave>('Leave', leaveSchema);

export interface ILeaveBalance extends Document {
  employeeId: Types.ObjectId;
  userId: Types.ObjectId;
  annual: number;
  sick: number;
  personal: number;
  usedAnnual: number;
  usedSick: number;
  usedPersonal: number;
}

const leaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    annual: { type: Number, default: 18 },
    sick: { type: Number, default: 10 },
    personal: { type: Number, default: 5 },
    usedAnnual: { type: Number, default: 0 },
    usedSick: { type: Number, default: 0 },
    usedPersonal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const LeaveBalance = mongoose.model<ILeaveBalance>('LeaveBalance', leaveBalanceSchema);
