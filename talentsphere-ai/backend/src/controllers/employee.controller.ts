import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { User, Employee, Department, Designation } from '../models';
import { predictAttrition } from '../ai/attritionPredictor';
import { Attendance, Leave, PerformanceReview } from '../models';

export async function listEmployees(req: AuthRequest, res: Response) {
  const { search, departmentId, page = '1', limit = '50' } = req.query;
  const filter: Record<string, unknown> = {};
  if (departmentId) filter.departmentId = departmentId;

  let query = Employee.find(filter)
    .populate('userId', 'name email role avatar')
    .populate('departmentId', 'name code')
    .populate('designationId', 'title')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const employees = await query;
  let results = employees;

  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    results = employees.filter((e) => {
      const u = e.userId as { name?: string; email?: string };
      return u?.name?.toLowerCase().includes(s) || e.employeeId.toLowerCase().includes(s);
    });
  }

  const total = await Employee.countDocuments(filter);
  res.json({ success: true, data: results, total, page: Number(page) });
}

export async function getEmployee(req: AuthRequest, res: Response) {
  const emp = await Employee.findById(req.params.id)
    .populate('userId', 'name email role')
    .populate('departmentId')
    .populate('designationId')
    .populate('managerId', 'name email');
  if (!emp) {
    res.status(404).json({ success: false, message: 'Employee not found' });
    return;
  }
  res.json({ success: true, data: emp });
}

export async function updateEmployee(req: AuthRequest, res: Response) {
  const emp = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: emp });
}

export async function listDepartments(_req: AuthRequest, res: Response) {
  const deps = await Department.find().sort({ name: 1 });
  res.json({ success: true, data: deps });
}

export async function createDepartment(req: AuthRequest, res: Response) {
  const dep = await Department.create(req.body);
  res.status(201).json({ success: true, data: dep });
}

export async function listDesignations(_req: AuthRequest, res: Response) {
  const items = await Designation.find().populate('departmentId', 'name');
  res.json({ success: true, data: items });
}

export async function computeAttrition(req: AuthRequest, res: Response) {
  const emp = await Employee.findById(req.params.id);
  if (!emp) {
    res.status(404).json({ success: false, message: 'Not found' });
    return;
  }

  const since = new Date();
  since.setDate(since.getDate() - 90);
  const [attendance, perf, leaveBal] = await Promise.all([
    Attendance.find({ userId: emp.userId, date: { $gte: since } }),
    PerformanceReview.find({ userId: emp.userId }),
    import('../models').then((m) => m.LeaveBalance.findOne({ userId: emp.userId })),
  ]);

  const lateDays = attendance.filter((a) => a.isLate || a.status === 'late').length;
  const absentDays = attendance.filter((a) => a.status === 'absent').length;
  const avgPerf =
    perf.length > 0 ? perf.reduce((s, p) => s + p.rating, 0) / perf.length : 3.5;
  const tenureMonths =
    (Date.now() - new Date(emp.joinDate).getTime()) / (30 * 24 * 3600 * 1000);
  const leaveUsagePct = leaveBal
    ? (leaveBal.usedAnnual + leaveBal.usedSick) / (leaveBal.annual + leaveBal.sick || 1)
    : 0;

  const result = predictAttrition({
    lateDays,
    absentDays,
    avgPerformance: avgPerf,
    leaveUsagePct,
    tenureMonths,
  });

  emp.attritionRisk = result.risk;
  emp.attritionScore = result.score;
  emp.attritionFactors = result.factors;
  await emp.save();

  res.json({ success: true, data: result });
}
