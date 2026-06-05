const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true },
    baseSalary: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    netPay: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'processed', 'paid'], default: 'processed' },
    payslipUrl: String,
  },
  { timestamps: true }
);

payrollSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
