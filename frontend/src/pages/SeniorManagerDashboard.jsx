import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import AIChatBot from '../components/AIChatBot';
import {
  StatusPieChart,
  SkillsBarChart,
  ScoreDistributionChart,
} from '../components/AnalyticsCharts';
import { statsAPI, hrAPI } from '../services/api';

export default function SeniorManagerDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  
  // Active actions state
  const [actionLoading, setActionLoading] = useState(false);
  const [leaveComments, setLeaveComments] = useState({}); // leafId -> comment text
  const [message, setMessage] = useState('');

  // Goals & Performance Form states
  const [selectedEmp, setSelectedEmp] = useState('');
  const [period, setPeriod] = useState('Annual 2026');
  const [goals, setGoals] = useState('');
  const [rating, setRating] = useState(4);
  const [feedback, setFeedback] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  
  // Specific employee logs states
  const [selectedEmpLog, setSelectedEmpLog] = useState('');
  const [empAttendance, setEmpAttendance] = useState([]);
  const [empInsights, setEmpInsights] = useState(null);

  const load = async () => {
    try {
      const [s, c, e, leaves] = await Promise.all([
        statsAPI.get(),
        hrAPI.companyDashboard(),
        hrAPI.employees(),
        hrAPI.pendingLeaves(),
      ]);
      setStats(s.data);
      setCompany(c.data);
      setEmployees(e.data);
      setPendingLeaves(leaves.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const handleLeaveAction = async (id, approve) => {
    setActionLoading(true);
    try {
      const comment = leaveComments[id] || '';
      if (approve) {
        await hrAPI.approveLeave(id, { comment });
        setMessage('Leave request approved successfully.');
      } else {
        await hrAPI.rejectLeave(id, { comment });
        setMessage('Leave request rejected.');
      }
      // Reload leaves
      const leaves = await hrAPI.pendingLeaves();
      setPendingLeaves(leaves.data);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setReviewSubmitting(true);
    try {
      const goalsArray = goals.split(',').map((g) => g.trim()).filter(Boolean);
      await hrAPI.createPerformance({
        userId: selectedEmp,
        period,
        goals: goalsArray,
        rating,
        feedback,
      });
      setMessage('Performance review and goals assigned successfully.');
      setGoals('');
      setFeedback('');
      setSelectedEmp('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Submission failed');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Watch selected employee log change to load attendance logs
  useEffect(() => {
    if (!selectedEmpLog) {
      setEmpAttendance([]);
      setEmpInsights(null);
      return;
    }
    Promise.allSettled([
      hrAPI.attendance({ userId: selectedEmpLog }),
      hrAPI.attendanceInsights({ userId: selectedEmpLog })
    ]).then(([attRes, insRes]) => {
      if (attRes.status === 'fulfilled') setEmpAttendance(attRes.value.data);
      if (insRes.status === 'fulfilled') setEmpInsights(insRes.value.data);
    });
  }, [selectedEmpLog]);

  const tabs = [
    { id: 'overview', label: 'Overview & Analytics' },
    { id: 'team', label: 'Team Directory' },
    { id: 'leaves', label: 'Leave Approvals' },
    { id: 'goals', label: 'Assign Goals & Reviews' },
    { id: 'attendance', label: 'Team Attendance Logs' },
  ];

  return (
    <Layout title="Senior Manager Dashboard">
      <AIChatBot />
      
      {message && (
        <div className="mb-4 p-3 bg-brand-50 text-brand-800 rounded-lg text-sm">{message}</div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
              tab === t.id ? 'bg-brand-600 text-white shadow-md' : 'bg-white border text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Employees" value={company?.employeeCount ?? stats?.employeeCount ?? 0} />
            <StatCard label="Present today" value={company?.presentToday ?? 0} />
            <StatCard label="Total applications" value={stats?.totalApplications ?? 0} />
            <StatCard label="Avg AI score" value={`${stats?.avgScore ?? 0}%`} />
            <StatCard
              label="Payroll disbursed"
              value={`$${(company?.totalPayrollDisbursed || stats?.payrollTotal || 0).toLocaleString()}`}
            />
            <StatCard label="Avg performance" value={`${company?.avgPerformanceRating ?? 0}/5`} />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <h3 className="font-semibold text-sm mb-3 text-slate-600">Hiring Funnel</h3>
              <StatusPieChart statusBreakdown={stats?.statusBreakdown} />
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <h3 className="font-semibold text-sm mb-3 text-slate-600">Top Matched Skills</h3>
              <SkillsBarChart topSkills={stats?.topSkills} />
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <h3 className="font-semibold text-sm mb-3 text-slate-600">AI Score Distribution</h3>
              <ScoreDistributionChart scoreDistribution={stats?.scoreDistribution} />
            </div>
          </div>
        </div>
      )}

      {tab === 'team' && (
        <div className="card overflow-hidden">
          <h2 className="font-semibold p-4 border-b">Team Members & Departments</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Department</th>
                  <th className="p-3 text-left">Designation</th>
                  <th className="p-3 text-left">Employee ID</th>
                  <th className="p-3 text-left">Email</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e._id} className="border-t">
                    <td className="p-3 font-semibold text-slate-800">{e.name}</td>
                    <td className="p-3">{e.department || '—'}</td>
                    <td className="p-3">{e.designation || '—'}</td>
                    <td className="p-3 font-mono">{e.employeeId || '—'}</td>
                    <td className="p-3 text-slate-500">{e.email}</td>
                  </tr>
                ))}
                {!employees.length && (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-slate-500">No team members registered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'leaves' && (
        <div className="card overflow-hidden">
          <h2 className="font-semibold p-4 border-b">Pending Leave Requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left">Employee</th>
                  <th className="p-3 text-left">Type / Duration</th>
                  <th className="p-3 text-left">Dates</th>
                  <th className="p-3 text-left">Reason</th>
                  <th className="p-3 text-left">Manager Comment</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaves.map((leave) => (
                  <tr key={leave._id} className="border-t">
                    <td className="p-3 font-semibold text-slate-800">
                      {leave.userId?.name || 'Unknown'}
                      <p className="text-xs font-normal text-slate-400">{leave.userId?.department}</p>
                    </td>
                    <td className="p-3 capitalize">
                      {leave.type} • {leave.days} day{leave.days === 1 ? '' : 's'}
                    </td>
                    <td className="p-3">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-slate-600 italic">"{leave.reason || 'No reason provided'}"</td>
                    <td className="p-3">
                      <input
                        type="text"
                        placeholder="Optional comment"
                        value={leaveComments[leave._id] || ''}
                        onChange={(e) => setLeaveComments({ ...leaveComments, [leave._id]: e.target.value })}
                        className="input-field text-xs py-1.5 px-2"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLeaveAction(leave._id, true)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs hover:bg-emerald-700 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleLeaveAction(leave._id, false)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs hover:bg-rose-700 transition"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!pendingLeaves.length && (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-500">
                      No pending leave requests at the moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'goals' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="section-heading mb-4">Assign Goals & Performance Review</h2>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Employee</label>
                <select
                  value={selectedEmp}
                  onChange={(e) => setSelectedEmp(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select an employee</option>
                  {employees.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.name} ({e.designation || 'Employee'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Review Period</label>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="input-field"
                    required
                    placeholder="Q2 2026 or Annual 2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Rating (out of 5)</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="input-field"
                  >
                    <option value="5">5 — Excellent</option>
                    <option value="4">4 — Good</option>
                    <option value="3">3 — Average</option>
                    <option value="2">2 — Below Average</option>
                    <option value="1">1 — Poor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assign Goals (comma-separated)</label>
                <input
                  type="text"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="input-field"
                  placeholder="Increase sales, Build new dashboard, Refactor database"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Manager Feedback / Remarks</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="input-field"
                  required
                  placeholder="Provide detailed feedback on goal progress and performance..."
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting || !selectedEmp}
                className="btn btn-primary w-full py-3 text-sm"
              >
                {reviewSubmitting ? 'Submitting Review...' : 'Submit Goals & Performance Review'}
              </button>
            </form>
          </div>

          <div className="card p-6 flex flex-col justify-between">
            <div>
              <h2 className="section-heading mb-4">Goal & Review Alignment Information</h2>
              <div className="space-y-3 text-sm text-slate-600">
                <p>
                  Setting specific, actionable goals is key to keeping your workforce motivated.
                  When you submit a review:
                </p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Goals are saved directly to the employee's performance file.</li>
                  <li>Our AI summary tool will automatically digest the review text and generate bulleted highlights.</li>
                  <li>The employee receives immediate insights and specific learning suggestions on their dashboard.</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 rounded-2xl bg-brand-50 border border-brand-100">
              <strong className="text-xs text-brand-800 uppercase block tracking-wider font-semibold mb-1">Scale Advice</strong>
              <p className="text-xs text-brand-900 leading-relaxed">
                Use Q1/Q2/Q3/Q4 labels to categorize performance records. Assigned goals will be tracked under the employee's portal automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="space-y-6">
          <div className="card p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Employee to View Logs</label>
            <select
              value={selectedEmpLog}
              onChange={(e) => setSelectedEmpLog(e.target.value)}
              className="input-field max-w-sm"
            >
              <option value="">Select an employee</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          {selectedEmpLog && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex flex-wrap justify-between items-center gap-2">
                <h3 className="font-semibold">Attendance Logs</h3>
                {empInsights?.riskLevel && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    empInsights.riskLevel === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    AI Risk Level: {empInsights.riskLevel}
                  </span>
                )}
              </div>

              {empInsights?.insights?.length > 0 && (
                <div className="p-4 bg-amber-50 text-sm text-amber-800 border-b">
                  <strong>AI Observations:</strong>
                  <ul className="list-disc ml-4 mt-1">
                    {empInsights.insights.map((ins, idx) => (
                      <li key={idx}>{ins}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Hours Worked</th>
                      <th className="p-3 text-left">Check In</th>
                      <th className="p-3 text-left">Check Out</th>
                      <th className="p-3 text-left">AI Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empAttendance.map((log) => (
                      <tr key={log._id} className="border-t">
                        <td className="p-3">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="p-3 capitalize">{log.status}</td>
                        <td className="p-3">{log.hoursWorked || '—'}</td>
                        <td className="p-3">{log.checkIn ? new Date(log.checkIn).toLocaleTimeString() : '—'}</td>
                        <td className="p-3">{log.checkOut ? new Date(log.checkOut).toLocaleTimeString() : '—'}</td>
                        <td className="p-3 capitalize">
                          <span className={log.aiFlag === 'anomaly' ? 'text-amber-600 font-semibold' : 'text-green-600'}>
                            {log.aiFlag}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!empAttendance.length && (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-slate-500">No logs found for the selected employee.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
