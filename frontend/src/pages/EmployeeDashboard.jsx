import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import AIChatBot from '../components/AIChatBot';
import { jobsAPI, applicationsAPI, hrAPI, aiAPI } from '../services/api';

function ScoreBadge({ score }) {
  const color =
    score >= 70 ? 'bg-green-100 text-green-800' : score >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {score ?? '—'}%
    </span>
  );
}

export default function EmployeeDashboard() {
  const [tab, setTab] = useState('overview');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [insights, setInsights] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [leaveType, setLeaveType] = useState('annual');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [uploading, setUploading] = useState(false);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    const results = await Promise.allSettled([
      jobsAPI.list(),
      applicationsAPI.list(),
      hrAPI.attendance(),
      hrAPI.payroll(),
      hrAPI.performance(),
      hrAPI.attendanceInsights(),
      hrAPI.leaves(),
      aiAPI.jobRecommendations(),
    ]);

    const [jobsRes, appsRes, attRes, payRes, perfRes, leavesRes, insRes, recRes] = results;
    if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value.data);
    if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data);
    if (attRes.status === 'fulfilled') setAttendance(attRes.value.data);
    if (payRes.status === 'fulfilled') setPayroll(payRes.value.data);
    if (perfRes.status === 'fulfilled') setPerformance(perfRes.value.data);
    if (leavesRes.status === 'fulfilled') setLeaveRequests(leavesRes.value.data);
    if (insRes.status === 'fulfilled') setInsights(insRes.value.data);
    if (recRes.status === 'fulfilled') setRecommendations(recRes.value.data);

    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
        console.error(`Employee dashboard load failed for request ${idx}:`, result.reason);
      }
    });
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const handleCheckIn = async () => {
    await hrAPI.checkIn({});
    await load();
    setMessage('Checked in successfully');
  };

  const handleCheckOut = async () => {
    await hrAPI.checkOut();
    await load();
    setMessage('Checked out successfully');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedJob || !resumeFile) return;
    setUploading(true);
    try {
      await applicationsAPI.uploadResume(selectedJob, resumeFile);
      setMessage('Resume uploaded — AI screening complete (no human intervention).');
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd) return;
    setLeaveSubmitting(true);
    try {
      await hrAPI.applyLeave({
        type: leaveType,
        startDate: leaveStart,
        endDate: leaveEnd,
        reason: leaveReason,
      });
      setMessage('Leave request submitted successfully.');
      setLeaveType('annual');
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveReason('');
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Leave request failed');
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'performance', label: 'Performance' },
    { id: 'leave', label: 'Leave Requests' },
    { id: 'careers', label: 'Careers & AI' },
  ];

  return (
    <Layout title="Employee Dashboard">
      <AIChatBot />
      {message && (
        <div className="mb-4 p-3 bg-brand-50 text-brand-800 rounded-lg text-sm">{message}</div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              tab === t.id ? 'bg-brand-600 text-white' : 'bg-white border text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Attendance records" value={attendance.length} />
            <StatCard label="Payslips" value={payroll.length} />
            <StatCard label="Applications" value={applications.length} />
            <StatCard
              label="AI risk level"
              value={insights?.riskLevel || '—'}
              sub={insights?.insights?.[0]}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCheckIn}
              className="btn btn-primary px-5 py-3 text-sm bg-green-600 hover:bg-green-700"
            >
              Check In
            </button>
            <button
              onClick={handleCheckOut}
              className="btn btn-secondary px-5 py-3 text-sm bg-slate-700 text-white hover:bg-slate-800"
            >
              Check Out
            </button>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="card overflow-hidden">
          {insights?.insights?.length > 0 && (
            <div className="p-4 bg-amber-50 border-b text-sm text-amber-800">
              <strong>AI Attendance Insights:</strong>
              <ul className="list-disc ml-4 mt-1">
                {insights.insights.map((i, idx) => (
                  <li key={idx}>{i}</li>
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
                  <th className="p-3 text-left">Hours</th>
                  <th className="p-3 text-left">AI Flag</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a._id} className="border-t">
                    <td className="p-3">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="p-3">{a.status}</td>
                    <td className="p-3">{a.hoursWorked || '—'}</td>
                    <td className="p-3">
                      <span
                        className={
                          a.aiFlag === 'anomaly' ? 'text-amber-600' : 'text-green-600'
                        }
                      >
                        {a.aiFlag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'payroll' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">Month</th>
                <th className="p-3 text-left">Base</th>
                <th className="p-3 text-left">Net Pay</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {payroll.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="p-3">{p.month}</td>
                  <td className="p-3">${p.baseSalary?.toLocaleString()}</td>
                  <td className="p-3 font-medium">${p.netPay?.toLocaleString()}</td>
                  <td className="p-3">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!payroll.length && <p className="p-4 text-slate-500 text-sm">No payroll records yet.</p>}
        </div>
      )}

      {tab === 'performance' && (
        <div className="space-y-4">
          {performance.map((p) => (
            <div key={p._id} className="card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-slate-900">{p.period}</span>
                <span className="text-sm text-slate-500">Rating: {p.rating}/5</span>
              </div>
              {p.aiSummary && (
                <p className="text-sm text-slate-600 mt-3">
                  <strong>AI Summary:</strong> {p.aiSummary}
                </p>
              )}
              {p.aiRecommendations?.length > 0 && (
                <ul className="text-sm text-slate-500 mt-3 list-disc ml-5 space-y-1">
                  {p.aiRecommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {!performance.length && (
            <p className="text-slate-500 text-sm">No performance reviews yet.</p>
          )}
        </div>
      )}

      {tab === 'leave' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="section-heading">Request Leave</h2>
            <form onSubmit={handleLeaveSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Leave type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="input-field"
                >
                  <option value="annual">Annual</option>
                  <option value="sick">Sick</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Start date</label>
                  <input
                    type="date"
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">End date</label>
                  <input
                    type="date"
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder="Optional details for HR"
                />
              </div>
              <button
                type="submit"
                disabled={leaveSubmitting}
                className="btn btn-primary w-full py-3 text-sm"
              >
                {leaveSubmitting ? 'Submitting request...' : 'Submit leave request'}
              </button>
            </form>
          </div>
          <div className="card p-6">
            <h2 className="section-heading">My leave requests</h2>
            <div className="space-y-4">
              {leaveRequests.map((leave) => (
                <div key={leave._id} className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {leave.type.replace(/^(.)/, (m) => m.toUpperCase())} leave
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        leave.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : leave.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {leave.status}
                    </span>
                  </div>
                  {leave.reason && <p className="text-sm text-slate-600 mt-3">{leave.reason}</p>}
                  {leave.managerComment && (
                    <p className="text-xs text-slate-500 mt-3">Manager note: {leave.managerComment}</p>
                  )}
                </div>
              ))}
              {!leaveRequests.length && (
                <p className="text-sm text-slate-500">Submit a leave request to see it listed here.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'careers' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="section-heading">AI Job Recommendations</h2>
            {recommendations.length > 0 ? (
              <ul className="space-y-3">
                {recommendations.map((r) => (
                  <li key={r.jobId} className="rounded-3xl bg-slate-50 p-4 text-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-medium text-slate-900">{r.title}</span>
                      <ScoreBadge score={r.matchScore} />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{r.feedback}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">
                No AI recommendations yet. Complete onboarding or upload a resume to get personalized matches.
              </p>
            )}
          </div>
          <div className="card p-6">
            <h2 className="section-heading">Apply — AI Resume Screening</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select job</label>
                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="input-field text-sm"
                  required
                >
                  <option value="">Select job</option>
                  {jobs.map((j) => (
                    <option key={j._id} value={j._id}>
                      {j.title}
                    </option>
                  ))}
                </select>
              </div>
              {!jobs.length && (
                <p className="text-sm text-slate-500">No open jobs available right now.</p>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Resume file</label>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  required
                  className="block w-full text-sm text-slate-700"
                />
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="btn btn-primary w-full py-3 text-sm"
              >
                {uploading ? 'AI screening...' : 'Upload resume'}
              </button>
            </form>
            <div className="mt-6 space-y-3">
              {applications.map((app) => (
                <div key={app._id} className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{app.jobId?.title}</p>
                    <p className="text-xs text-slate-500">{app.extractedName || app.userId?.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ScoreBadge score={app.score} />
                    <Link to={`/interview/${app._id}`} className="text-brand-600 text-xs font-semibold hover:underline">
                      Video
                    </Link>
                  </div>
                </div>
              ))}
              {!applications.length && (
                <p className="text-sm text-slate-500">No applications submitted yet. Upload your resume to start.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
