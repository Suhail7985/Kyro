const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Payroll = require('../models/Payroll');

async function getStatistics(req, res) {
  try {
    const [totalUsers, totalJobs, totalApplications, applications, employeeCount, payrollAgg] =
      await Promise.all([
        User.countDocuments(),
        Job.countDocuments(),
        Application.countDocuments(),
        Application.find().populate('jobId', 'title'),
        User.countDocuments({ role: { $in: ['employee', 'candidate'] } }),
        Payroll.aggregate([{ $group: { _id: null, total: { $sum: '$netPay' } } }]),
      ]);

    const statusCounts = {};
    const skillCounts = {};

    for (const app of applications) {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
      for (const skill of app.matchedSkills || []) {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      }
    }

    const scores = applications.map((a) => a.score).filter((s) => s > 0);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    const shortlisted = statusCounts.Shortlisted || 0;
    const rejected = statusCounts.Rejected || 0;

    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    const deptBreakdown = await User.aggregate([
      { $match: { department: { $exists: true, $ne: null } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]);

    res.json({
      totalUsers,
      totalJobs,
      totalApplications,
      employeeCount,
      payrollTotal: payrollAgg[0]?.total || 0,
      avgScore,
      shortlisted,
      rejected,
      statusBreakdown: statusCounts,
      topSkills,
      departmentBreakdown: deptBreakdown.map((d) => ({ department: d._id, count: d.count })),
      scoreDistribution: {
        high: scores.filter((s) => s >= 70).length,
        medium: scores.filter((s) => s >= 40 && s < 70).length,
        low: scores.filter((s) => s < 40).length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getStatistics };
