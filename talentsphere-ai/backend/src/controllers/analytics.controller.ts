import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import {
  User,
  Employee,
  Job,
  Application,
  Attendance,
  Payroll,
  Leave,
  PerformanceReview,
  Department,
} from '../models';

export async function adminDashboard(_req: AuthRequest, res: Response) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalEmployees,
    totalRecruiters,
    openJobs,
    presentToday,
    totalEmployeesAll,
    applications,
    payrollAgg,
    perfAvg,
    leavePending,
    departments,
  ] = await Promise.all([
    Employee.countDocuments({ lifecycleStage: 'active' }),
    User.countDocuments({ role: 'hr_recruiter' }),
    Job.countDocuments({ status: 'open' }),
    Attendance.countDocuments({ date: { $gte: today }, status: { $in: ['present', 'remote', 'late'] } }),
    Employee.countDocuments(),
    Application.find().select('status aiScore createdAt'),
    Payroll.aggregate([{ $group: { _id: null, total: { $sum: '$netPay' } } }]),
    PerformanceReview.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
    Leave.countDocuments({ status: 'pending' }),
    Department.find().select('name employeeCount'),
  ]);

  const attendanceRate =
    totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

  const statusCounts: Record<string, number> = {};
  applications.forEach((a) => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });

  const hiringFunnel = [
    { stage: 'Applied', count: statusCounts.applied || 0 },
    { stage: 'Screening', count: statusCounts.screening || 0 },
    { stage: 'Interview', count: statusCounts.interview || 0 },
    { stage: 'Offered', count: statusCounts.offered || 0 },
    { stage: 'Hired', count: statusCounts.hired || 0 },
  ];

  const riskCounts = await Employee.aggregate([
    { $group: { _id: '$attritionRisk', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    data: {
      totalEmployees,
      totalRecruiters,
      openJobs,
      attendanceRate,
      payrollCost: payrollAgg[0]?.total || 0,
      avgPerformance: Math.round((perfAvg[0]?.avg || 0) * 10) / 10,
      pendingLeaves: leavePending,
      hiringFunnel,
      attritionAnalytics: riskCounts.map((r) => ({ risk: r._id, count: r.count })),
      departmentDistribution: departments.map((d) => ({
        name: d.name,
        count: d.employeeCount,
      })),
      totalApplications: applications.length,
      workforceSize: totalEmployeesAll,
    },
  });
}

export async function managerDashboard(req: AuthRequest, res: Response) {
  const team = await Employee.find({ managerId: req.user!._id }).select('userId');
  const teamUserIds = team.map((t) => t.userId);

  const [leaves, attendance, performance] = await Promise.all([
    Leave.find({ userId: { $in: teamUserIds }, status: 'pending' }).populate('userId', 'name'),
    Attendance.find({ userId: { $in: teamUserIds } }).sort({ date: -1 }).limit(30),
    PerformanceReview.find({ userId: { $in: teamUserIds } }).sort({ createdAt: -1 }).limit(20),
  ]);

  res.json({
    success: true,
    data: { teamSize: team.length, pendingLeaves: leaves, attendance, performance },
  });
}

export async function recruiterDashboard(_req: AuthRequest, res: Response) {
  const [jobs, applications, interviews] = await Promise.all([
    Job.find({ status: 'open' }).sort({ createdAt: -1 }),
    Application.find().sort({ aiScore: -1 }).limit(50).populate('candidateId', 'name email').populate('jobId', 'title'),
    Application.countDocuments({ status: 'interview' }),
  ]);

  res.json({
    success: true,
    data: {
      openPositions: jobs.length,
      jobs,
      topCandidates: applications.slice(0, 10),
      interviewPipeline: interviews,
      resumeRankings: applications.map((a, i) => ({
        rank: i + 1,
        name: (a.candidateId as { name?: string })?.name,
        score: a.aiScore,
        job: (a.jobId as { title?: string })?.title,
        recommendation: a.analysis?.hiringRecommendation,
      })),
    },
  });
}

export async function employeeDashboard(req: AuthRequest, res: Response) {
  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) {
    res.json({ success: true, data: { onboarding: true } });
    return;
  }

  const [attendance, leaveBalance, payroll, performance, onboarding] = await Promise.all([
    Attendance.find({ userId: req.user!._id }).sort({ date: -1 }).limit(10),
    import('../models').then((m) => m.LeaveBalance.findOne({ userId: req.user!._id })),
    Payroll.find({ userId: req.user!._id }).sort({ month: -1 }).limit(3),
    PerformanceReview.find({ userId: req.user!._id }).sort({ createdAt: -1 }).limit(3),
    import('../models').then((m) => m.Onboarding.findOne({ userId: req.user!._id })),
  ]);

  res.json({
    success: true,
    data: { employee: emp, attendance, leaveBalance, payroll, performance, onboarding },
  });
}

export async function chartData(_req: AuthRequest, res: Response) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const employeeGrowth = months.map((m, i) => ({ month: m, count: 80 + i * 15 }));
  const attendanceTrends = months.map((m, i) => ({ month: m, rate: 88 + (i % 4) }));
  const payrollAnalytics = months.map((m, i) => ({ month: m, cost: 420000 + i * 12000 }));

  res.json({
    success: true,
    data: { employeeGrowth, attendanceTrends, payrollAnalytics },
  });
}
