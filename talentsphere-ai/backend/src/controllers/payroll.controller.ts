import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Payroll, Employee } from '../models';

export async function myPayroll(req: AuthRequest, res: Response) {
  const records = await Payroll.find({ userId: req.user!._id }).sort({ month: -1 });
  res.json({ success: true, data: records });
}

export async function processPayroll(req: AuthRequest, res: Response) {
  const month = req.body.month || new Date().toISOString().slice(0, 7);
  const employees = await Employee.find({ salary: { $gt: 0 }, lifecycleStage: 'active' });
  const results = [];

  for (const emp of employees) {
    const bonus = req.body.bonusRate ? Math.round(emp.salary * req.body.bonusRate) : 0;
    const tax = Math.round(emp.salary * 0.1);
    const allowances = Math.round(emp.salary * 0.05);
    const netPay = emp.salary + bonus + allowances - tax - (req.body.deductions || 0);

    const doc = await Payroll.findOneAndUpdate(
      { userId: emp.userId, month },
      {
        employeeId: emp._id,
        userId: emp.userId,
        baseSalary: emp.salary,
        bonus,
        allowances,
        tax,
        deductions: req.body.deductions || 0,
        netPay,
        status: 'processed',
      },
      { upsert: true, new: true }
    );
    results.push(doc);
  }

  res.json({ success: true, data: { processed: results.length, month } });
}

export async function payrollDashboard(_req: AuthRequest, res: Response) {
  const records = await Payroll.find().sort({ month: -1 }).limit(100);
  const total = records.reduce((s, r) => s + r.netPay, 0);
  res.json({ success: true, data: { records, totalPayroll: total } });
}
