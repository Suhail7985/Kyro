import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPayroll extends Document {
  employeeId: Types.ObjectId;
  userId: Types.ObjectId;
  month: string;
  baseSalary: number;
  bonus: number;
  allowances: number;
  tax: number;
  deductions: number;
  netPay: number;
  status: 'draft' | 'processed' | 'paid';
  payslipUrl?: string;
}

const payrollSchema = new Schema<IPayroll>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true },
    baseSalary: { type: Number, required: true },
    bonus: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netPay: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'processed', 'paid'], default: 'processed' },
    payslipUrl: String,
  },
  { timestamps: true }
);

payrollSchema.index({ userId: 1, month: 1 }, { unique: true });

export const Payroll = mongoose.model<IPayroll>('Payroll', payrollSchema);
