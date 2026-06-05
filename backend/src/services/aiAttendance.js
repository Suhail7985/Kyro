const Attendance = require('../models/Attendance');

/**
 * AI Feature: Detect attendance anomalies (late patterns, missing check-outs).
 */
async function analyzeAttendanceAnomalies(userId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const records = await Attendance.find({ userId, date: { $gte: since } }).sort({ date: -1 });
  const insights = [];
  let anomalyCount = 0;

  const lateDays = records.filter((r) => r.status === 'late').length;
  const absentDays = records.filter((r) => r.status === 'absent').length;
  const missingCheckout = records.filter((r) => r.checkIn && !r.checkOut).length;

  if (lateDays >= 3) {
    insights.push(`Late arrival pattern detected (${lateDays} days in ${days}d window).`);
    anomalyCount++;
  }
  if (absentDays >= 2) {
    insights.push(`Elevated absences: ${absentDays} days — HR review suggested.`);
    anomalyCount++;
  }
  if (missingCheckout >= 2) {
    insights.push(`Missing check-outs on ${missingCheckout} days — verify timesheets.`);
    anomalyCount++;
  }

  const avgHours =
    records.length > 0
      ? records.reduce((s, r) => s + (r.hoursWorked || 0), 0) / records.length
      : 0;

  if (avgHours > 10) {
    insights.push('Average daily hours exceed 10h — monitor for burnout risk.');
    anomalyCount++;
  }

  const riskLevel = anomalyCount >= 3 ? 'high' : anomalyCount >= 1 ? 'medium' : 'low';

  for (const rec of records) {
    if (rec.status === 'late' || (rec.checkIn && !rec.checkOut)) {
      rec.aiFlag = 'anomaly';
    } else {
      rec.aiFlag = 'normal';
    }
  }
  await Promise.all(records.map((r) => r.save()));

  return {
    riskLevel,
    insights,
    stats: { lateDays, absentDays, missingCheckout, avgHours: Math.round(avgHours * 10) / 10 },
    recordsAnalyzed: records.length,
  };
}

module.exports = { analyzeAttendanceAnomalies };
