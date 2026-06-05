/**
 * AI-powered employee burnout risk analysis service.
 * Aggregates attendance and leave data over the last 60 days to compute
 * per-employee risk scores. Optionally enriches results with Gemini AI insights.
 */

const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const User = require('../models/User');

/**
 * Weighted risk factor contributions:
 * - Overtime (>9hrs days): 30%
 * - Consecutive work days: 25%
 * - Low leave frequency: 20%
 * - Late arrivals: 15%
 * - High avg hours: 10%
 */
const WEIGHTS = {
  overtime: 0.30,
  consecutiveDays: 0.25,
  lowLeave: 0.20,
  lateCount: 0.15,
  highAvgHours: 0.10,
};

/**
 * Analyzes burnout risk for one or all employees.
 * @param {string|null} employeeId — If null, analyze all employees.
 * @returns {Promise<Array>} Risk analysis results sorted by riskScore descending.
 */
async function analyzeBurnoutRisk(employeeId = null) {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Find target employees
  const employeeFilter = { role: { $in: ['employee', 'hr_recruiter', 'senior_manager'] } };
  if (employeeId) employeeFilter._id = employeeId;
  const employees = await User.find(employeeFilter).select('name email department designation').lean();

  if (!employees.length) return [];

  const employeeIds = employees.map((e) => e._id);

  // Batch-fetch attendance and leave data
  const [attendanceRecords, leaveRecords] = await Promise.all([
    Attendance.find({ userId: { $in: employeeIds }, date: { $gte: sixtyDaysAgo } })
      .sort({ date: 1 })
      .lean(),
    Leave.find({
      userId: { $in: employeeIds },
      status: 'approved',
      startDate: { $gte: sixtyDaysAgo },
    }).lean(),
  ]);

  // Group records by userId
  const attendanceByUser = {};
  const leaveByUser = {};
  for (const rec of attendanceRecords) {
    const uid = rec.userId.toString();
    if (!attendanceByUser[uid]) attendanceByUser[uid] = [];
    attendanceByUser[uid].push(rec);
  }
  for (const rec of leaveRecords) {
    const uid = rec.userId.toString();
    if (!leaveByUser[uid]) leaveByUser[uid] = [];
    leaveByUser[uid].push(rec);
  }

  const results = [];

  for (const emp of employees) {
    const uid = emp._id.toString();
    const records = attendanceByUser[uid] || [];
    const leaves = leaveByUser[uid] || [];

    // Compute metrics
    const totalHours = records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
    const workDays = records.filter((r) => r.hoursWorked > 0).length;
    const avgHoursPerDay = workDays > 0 ? Math.round((totalHours / workDays) * 10) / 10 : 0;
    const overtimeCount = records.filter((r) => (r.hoursWorked || 0) > 9).length;
    const lateCount = records.filter((r) => r.status === 'late').length;
    const leaveFrequency = leaves.length;

    // Longest consecutive work streak (days without a break)
    let consecutiveWorkDays = 0;
    let currentStreak = 0;
    const sortedDates = records
      .filter((r) => r.checkIn)
      .map((r) => new Date(r.date).toISOString().slice(0, 10))
      .sort();

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
      }
      if (currentStreak > consecutiveWorkDays) consecutiveWorkDays = currentStreak;
    }

    // Risk score calculation (0-100)
    const overtimeScore = Math.min((overtimeCount / 15) * 100, 100); // 15+ overtime days = max
    const consecutiveScore = Math.min((consecutiveWorkDays / 14) * 100, 100); // 14+ days streak = max
    const lowLeaveScore = leaveFrequency <= 1 ? 80 : leaveFrequency <= 3 ? 40 : 0; // No leaves = high risk
    const lateScore = Math.min((lateCount / 10) * 100, 100); // 10+ late days = max
    const avgHoursScore = avgHoursPerDay > 10 ? 100 : avgHoursPerDay > 9 ? 60 : avgHoursPerDay > 8 ? 20 : 0;

    const riskScore = Math.round(
      overtimeScore * WEIGHTS.overtime +
      consecutiveScore * WEIGHTS.consecutiveDays +
      lowLeaveScore * WEIGHTS.lowLeave +
      lateScore * WEIGHTS.lateCount +
      avgHoursScore * WEIGHTS.highAvgHours
    );

    const riskLevel =
      riskScore >= 76 ? 'critical' :
      riskScore >= 51 ? 'high' :
      riskScore >= 26 ? 'moderate' : 'low';

    results.push({
      employeeId: emp._id,
      employeeName: emp.name,
      department: emp.department || 'N/A',
      avgHoursPerDay,
      overtimeCount,
      lateCount,
      leaveFrequency,
      consecutiveWorkDays,
      riskScore,
      riskLevel,
      aiAssessment: null, // populated below
      recommendations: [],
    });
  }

  // Attempt Gemini AI enrichment
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && results.length > 0) {
    try {
      const statsForAI = results.map((r) => ({
        name: r.employeeName,
        department: r.department,
        avgHoursPerDay: r.avgHoursPerDay,
        overtimeCount: r.overtimeCount,
        lateCount: r.lateCount,
        leaveFrequency: r.leaveFrequency,
        consecutiveWorkDays: r.consecutiveWorkDays,
        riskScore: r.riskScore,
        riskLevel: r.riskLevel,
      }));

      const prompt = `You are an HR analytics AI. Analyze these employee burnout risk metrics from the last 60 days and provide actionable insights.

Employee Data:
${JSON.stringify(statsForAI, null, 2)}

For each employee, provide a brief assessment and 2-3 specific recommendations.

Respond ONLY with valid JSON in this format:
{
  "employees": [
    {
      "name": "Employee Name",
      "assessment": "Brief burnout risk assessment",
      "recommendations": ["recommendation 1", "recommendation 2"]
    }
  ]
}`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });
      const data = await res.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const parsed = JSON.parse(resultText.replace(/```json|```/g, '').trim());

      if (parsed.employees && Array.isArray(parsed.employees)) {
        for (const aiResult of parsed.employees) {
          const match = results.find(
            (r) => r.employeeName.toLowerCase() === aiResult.name?.toLowerCase()
          );
          if (match) {
            match.aiAssessment = aiResult.assessment || null;
            match.recommendations = aiResult.recommendations || [];
          }
        }
      }
    } catch (err) {
      console.error('Gemini burnout analysis error, using rule-based fallback:', err.message);
    }
  }

  // Fill rule-based fallbacks for any employees without AI assessment
  for (const r of results) {
    if (!r.aiAssessment) {
      r.aiAssessment = generateRuleBasedAssessment(r);
      r.recommendations = generateRuleBasedRecommendations(r);
    }
  }

  return results.sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Generates a rule-based burnout assessment string.
 */
function generateRuleBasedAssessment(r) {
  const parts = [];
  if (r.riskLevel === 'critical') {
    parts.push(`${r.employeeName} shows critical burnout indicators.`);
  } else if (r.riskLevel === 'high') {
    parts.push(`${r.employeeName} has elevated burnout risk.`);
  } else if (r.riskLevel === 'moderate') {
    parts.push(`${r.employeeName} shows moderate workload stress.`);
  } else {
    parts.push(`${r.employeeName} has a healthy work-life balance.`);
  }

  if (r.overtimeCount > 5) parts.push(`Worked overtime on ${r.overtimeCount} days.`);
  if (r.consecutiveWorkDays > 10) parts.push(`Worked ${r.consecutiveWorkDays} consecutive days without a break.`);
  if (r.leaveFrequency === 0) parts.push('Has not taken any leave in the last 60 days.');
  if (r.avgHoursPerDay > 9) parts.push(`Averaging ${r.avgHoursPerDay} hours/day.`);

  return parts.join(' ');
}

/**
 * Generates rule-based recommendations based on risk factors.
 */
function generateRuleBasedRecommendations(r) {
  const recs = [];
  if (r.overtimeCount > 5) recs.push('Review workload distribution and consider delegating tasks.');
  if (r.consecutiveWorkDays > 10) recs.push('Encourage mandatory rest days and enforce weekly off policies.');
  if (r.leaveFrequency <= 1) recs.push('Encourage using accrued leave to prevent burnout accumulation.');
  if (r.lateCount > 5) recs.push('Discuss potential scheduling flexibility or commute challenges.');
  if (r.avgHoursPerDay > 9) recs.push('Monitor daily hours and explore process efficiency improvements.');
  if (recs.length === 0) recs.push('Continue current work-life balance practices.');
  return recs;
}

module.exports = { analyzeBurnoutRisk };
