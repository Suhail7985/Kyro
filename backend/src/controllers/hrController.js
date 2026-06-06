const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const PerformanceReview = require('../models/PerformanceReview');
const Leave = require('../models/Leave');
const { analyzeAttendanceAnomalies } = require('../services/aiAttendance');
const { generatePerformanceInsights } = require('../services/aiPerformance');
const { userHasRole } = require('../utils/roles');

async function listEmployees(req, res) {
  try {
    const filter = { role: { $in: ['employee', 'hr_recruiter', 'senior_manager'] } };
    if (req.query.department) filter.department = req.query.department;
    const employees = await User.find(filter)
      .select('-passwordHash')
      .sort({ name: 1 })
      .limit(500);
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getEmployee(req, res) {
  try {
    const emp = await User.findById(req.params.id).select('-passwordHash');
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateEmployee(req, res) {
  try {
    const allowed = ['department', 'designation', 'salary', 'managerId', 'employeeId', 'joinDate'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const emp = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select(
      '-passwordHash'
    );
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function checkIn(req, res) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let record = await Attendance.findOne({ userId: req.user._id, date: today });
    const now = new Date();
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);

    if (!record) {
      record = await Attendance.create({
        userId: req.user._id,
        date: today,
        checkIn: now,
        status: isLate ? 'late' : req.body.remote ? 'remote' : 'present',
      });
    } else if (!record.checkIn) {
      record.checkIn = now;
      record.status = isLate ? 'late' : record.status;
      await record.save();
    } else {
      return res.status(400).json({ message: 'Already checked in today' });
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function checkOut(req, res) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const record = await Attendance.findOne({ userId: req.user._id, date: today });
    if (!record?.checkIn) return res.status(400).json({ message: 'Check in first' });
    record.checkOut = new Date();
    const ms = record.checkOut - record.checkIn;
    record.hoursWorked = Math.round((ms / 3600000) * 100) / 100;
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getAttendance(req, res) {
  try {
    const userId = req.query.userId || req.user._id;
    if (userId !== req.user._id.toString() && !userHasRole(req.user, ['admin', 'senior_manager'])) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const records = await Attendance.find({ userId }).sort({ date: -1 }).limit(60);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function attendanceInsights(req, res) {
  try {
    const userId = req.query.userId || req.user._id;
    if (userId !== req.user._id.toString() && !userHasRole(req.user, ['admin', 'senior_manager'])) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const analysis = await analyzeAttendanceAnomalies(userId);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getPayroll(req, res) {
  try {
    const userId = req.query.userId || req.user._id;
    if (userId !== req.user._id.toString() && !userHasRole(req.user, ['admin'])) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const records = await Payroll.find({ userId }).sort({ month: -1 }).limit(12);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function applyLeave(req, res) {
  try {
    const { type, startDate, endDate, reason } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return res.status(400).json({ message: 'Invalid leave dates' });
    }
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const leave = await Leave.create({
      userId: req.user._id,
      type: ['annual', 'sick', 'personal'].includes(type) ? type : 'annual',
      startDate: start,
      endDate: end,
      days,
      reason: reason || '',
    });

    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getMyLeaves(req, res) {
  try {
    const leaves = await Leave.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function pendingLeaves(req, res) {
  try {
    const leaves = await Leave.find({ status: 'pending' })
      .populate('userId', 'name email department')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function approveLeave(req, res) {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    leave.status = 'approved';
    if (req.body.comment) leave.managerComment = req.body.comment;
    await leave.save();
    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function rejectLeave(req, res) {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    leave.status = 'rejected';
    if (req.body.comment) leave.managerComment = req.body.comment;
    await leave.save();
    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function runPayroll(req, res) {
  try {
    const { month } = req.body;
    const employees = await User.find({
      role: 'employee',
      salary: { $gt: 0 },
    });
    const created = [];
    
    const stripeApiKey = process.env.STRIPE_SECRET_KEY;
    const stripe = stripeApiKey ? require('stripe')(stripeApiKey) : null;

    for (const emp of employees) {
      const tax = Math.round(emp.salary * 0.1);
      const allowances = Math.round(emp.salary * 0.05);
      const netPay = emp.salary + allowances - tax;

      let stripePaymentId = '';

      if (stripe) {
        try {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(netPay * 100),
            currency: 'usd',
            payment_method: 'pm_card_visa',
            confirm: true,
            description: `Payroll payout for ${emp.name} (${month})`,
            automatic_payment_methods: {
              enabled: true,
              allow_redirects: 'never',
            },
          });
          stripePaymentId = paymentIntent.id;
        } catch (stripeErr) {
          console.error(`Stripe payment failed for employee ${emp.name}:`, stripeErr.message);
          stripePaymentId = `stripe_err_${Date.now()}`;
        }
      } else {
        stripePaymentId = `stripe_mock_ch_${Math.random().toString(36).slice(-8)}`;
      }

      const doc = await Payroll.findOneAndUpdate(
        { userId: emp._id, month },
        {
          baseSalary: emp.salary,
          tax,
          deductions: 0,
          allowances,
          netPay,
          status: 'paid',
          stripePaymentId,
        },
        { upsert: true, new: true }
      );
      created.push(doc);

      // Trigger email alert
      const { sendEmail } = require('../utils/mailer');
      sendEmail({
        to: emp.email,
        subject: `Payslip Issued - ${month}`,
        text: `Hello ${emp.name},\n\nYour payroll for ${month} has been processed.\nNet Payout: $${netPay}\nTransaction Ref: ${stripePaymentId}\n\nYou can view and download your payslip on the Employee Dashboard.\n\nBest regards,\nKyro HR Team`,
        html: `<p>Hello <b>${emp.name}</b>,</p><p>Your payroll for <b>${month}</b> has been processed.</p><p><b>Net Payout:</b> $${netPay}<br><b>Transaction Ref:</b> ${stripePaymentId}</p><p>You can view and download your payslip on the Employee Dashboard.</p><br><p>Best regards,<br>Kyro HR Team</p>`
      }).catch(err => console.error('Failed to notify employee in background:', err.message));
    }
    res.json({ message: `Payroll processed for ${created.length} employees`, count: created.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function listPerformance(req, res) {
  try {
    const userId = req.query.userId || req.user._id;
    if (userId !== req.user._id.toString() && !userHasRole(req.user, ['admin', 'senior_manager', 'hr_recruiter'])) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const reviews = await PerformanceReview.find({ userId })
      .populate('reviewerId', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function createPerformance(req, res) {
  try {
    const { userId, period, goals, achievements, rating, feedback } = req.body;
    const review = await PerformanceReview.create({
      userId: userId || req.user._id,
      reviewerId: req.user._id,
      period,
      goals: goals || [],
      achievements,
      rating,
      feedback,
      status: 'submitted',
    });
    const ai = await generatePerformanceInsights(review);
    review.aiSummary = ai.summary;
    review.aiRecommendations = ai.recommendations;
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function companyDashboard(req, res) {
  try {
    const [empCount, attendanceToday, payrollTotal, perfAvg] = await Promise.all([
      User.countDocuments({ role: 'employee' }),
      Attendance.countDocuments({
        date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        status: { $in: ['present', 'remote', 'late'] },
      }),
      Payroll.aggregate([{ $group: { _id: null, total: { $sum: '$netPay' } } }]),
      PerformanceReview.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
    ]);
    res.json({
      employeeCount: empCount,
      presentToday: attendanceToday,
      totalPayrollDisbursed: payrollTotal[0]?.total || 0,
      avgPerformanceRating: Math.round((perfAvg[0]?.avg || 0) * 10) / 10,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  listEmployees,
  getEmployee,
  updateEmployee,
  checkIn,
  checkOut,
  getAttendance,
  attendanceInsights,
  getPayroll,
  runPayroll,
  listPerformance,
  createPerformance,
  companyDashboard,
  applyLeave,
  getMyLeaves,
  pendingLeaves,
  approveLeave,
  rejectLeave,
};
