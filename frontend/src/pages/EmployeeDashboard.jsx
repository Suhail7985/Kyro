import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import AIChatBot from '../components/AIChatBot';
import { hrAPI, usersAPI, authAPI } from '../services/api';

export default function EmployeeDashboard() {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState('overview');
  const [attendance, setAttendance] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [insights, setInsights] = useState(null);

  // Live timer states
  const [time, setTime] = useState(new Date());
  const [elapsed, setElapsed] = useState('');

  // Leave form states
  const [leaveType, setLeaveType] = useState('annual');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  // Profile form states
  const [profilePhone, setProfilePhone] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [profileLinkedin, setProfileLinkedin] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileSkills, setProfileSkills] = useState('');
  const [profileExperience, setProfileExperience] = useState('');
  const [profileEducation, setProfileEducation] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const [message, setMessage] = useState('');

  const load = async () => {
    const results = await Promise.allSettled([
      hrAPI.attendance(),
      hrAPI.payroll(),
      hrAPI.performance(),
      hrAPI.attendanceInsights(),
      hrAPI.leaves(),
    ]);

    const [attRes, payRes, perfRes, insRes, leavesRes] = results;
    if (attRes.status === 'fulfilled') setAttendance(attRes.value.data || []);
    if (payRes.status === 'fulfilled') setPayroll(payRes.value.data || []);
    if (perfRes.status === 'fulfilled') setPerformance(perfRes.value.data || []);
    if (insRes.status === 'fulfilled') setInsights(insRes.value.data || null);
    if (leavesRes.status === 'fulfilled') setLeaveRequests(leavesRes.value.data || []);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  // Update live clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's attendance status calculation
  const todayRecord = attendance.find(
    (a) => new Date(a.date).toDateString() === new Date().toDateString()
  );
  const isClockedIn = todayRecord && todayRecord.checkIn && !todayRecord.checkOut;
  const isClockedOut = todayRecord && todayRecord.checkIn && todayRecord.checkOut;

  // Update elapsed time for live check-in shift
  useEffect(() => {
    if (!isClockedIn || !todayRecord?.checkIn) {
      setElapsed('');
      return;
    }
    const interval = setInterval(() => {
      const diff = new Date() - new Date(todayRecord.checkIn);
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [isClockedIn, todayRecord]);

  // Sync profile details
  useEffect(() => {
    if (user) {
      setProfilePhone(user.profile?.phone || '');
      setProfileLocation(user.profile?.location || '');
      setProfileLinkedin(user.profile?.linkedin || '');
      setProfileBio(user.profile?.bio || '');
      setProfileSkills((user.profile?.skills || []).join(', '));
      setProfileExperience(user.profile?.experience || '');
      setProfileEducation(user.profile?.education || '');
      setMfaEnabled(user.mfaEnabled || false);
    }
  }, [user]);

  const handleCheckIn = async (remote) => {
    if (remote) {
      executeCheckIn(true);
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser. Checking in without GPS.");
      executeCheckIn(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        executeCheckIn(false, position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.warn("Geolocation denied or failed:", error.message);
        executeCheckIn(false); // Fallback without GPS
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const executeCheckIn = async (remote, lat = null, lng = null) => {
    try {
      await hrAPI.checkIn({ remote, lat, lng });
      await load();
      setMessage(`Successfully clocked in ${remote ? 'remote' : 'onsite'}.`);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await hrAPI.checkOut();
      await load();
      setMessage('Clocked out successfully.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Check-out failed');
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

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSubmitting(true);
    try {
      const skillsArray = profileSkills.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await usersAPI.updateProfile({
        phone: profilePhone,
        location: profileLocation,
        linkedin: profileLinkedin,
        bio: profileBio,
        skills: skillsArray,
        experience: profileExperience,
        education: profileEducation,
      });
      const updatedUser = { ...user, profile: res.data.user.profile };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Profile update failed');
    } finally {
      setProfileSubmitting(false);
    }
  };

  // Metrics definitions
  const presentDays = attendance.filter((a) => ['present', 'remote', 'late'].includes(a.status?.toLowerCase())).length;
  const lateDays = attendance.filter((a) => a.status?.toLowerCase() === 'late').length;
  const remoteDays = attendance.filter((a) => a.status?.toLowerCase() === 'remote').length;
  const totalHours = attendance.reduce((acc, a) => acc + (a.hoursWorked || 0), 0);
  const avgHours = attendance.length > 0 ? (totalHours / attendance.length).toFixed(1) : '0.0';

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'attendance', label: 'Attendance Console' },
    { id: 'payroll', label: 'Payslips & Payroll' },
    { id: 'performance', label: 'Performance Reviews' },
    { id: 'leave', label: 'Leave Requests' },
    { id: 'profile', label: 'My Profile' },
  ];

  return (
    <Layout title={`Employee Dashboard — ${user?.name || 'Kyro Employee'}`}>
      <AIChatBot />
      {message && (
        <div className="mb-6 p-4 bg-brand-50 border border-brand-100 text-brand-800 rounded-2xl text-sm flex justify-between items-center shadow-sm">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="font-semibold text-xs text-brand-600 hover:text-brand-800">Dismiss</button>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all duration-200 ${
              tab === t.id ? 'bg-brand-600 text-white shadow-md' : 'bg-white border text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Present Days" value={presentDays} />
            <StatCard label="Average Hours / Shift" value={`${avgHours} hrs`} />
            <StatCard label="Remote Shifts" value={remoteDays} />
            <StatCard label="Late Check-ins" value={lateDays} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Clock-In Widget */}
            <div className="card p-6 flex flex-col justify-between items-center text-center space-y-4 relative overflow-hidden">
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {isClockedIn ? 'Active Shift' : isClockedOut ? 'Shift Completed' : 'Offline'}
                </span>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Current Time</p>
                <h2 className="text-3xl font-black text-slate-800 mt-1 font-mono tracking-tight">
                  {time.toLocaleTimeString()}
                </h2>
                <p className="text-xs text-slate-500 mt-1">{time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>

              {isClockedIn && (
                <div className="bg-brand-50 p-4 border border-brand-100 rounded-3xl w-full">
                  <span className="text-xs text-brand-700 block uppercase font-bold tracking-wider">Elapsed Shift Time</span>
                  <span className="text-2xl font-black text-brand-800 font-mono mt-1 block">{elapsed || '00:00:00'}</span>
                </div>
              )}

              {isClockedOut ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl w-full">
                  <p className="font-semibold text-xs">✓ Daily Shift Completed!</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Checked in at: {new Date(todayRecord.checkIn).toLocaleTimeString()} · Checked out at: {new Date(todayRecord.checkOut).toLocaleTimeString()}</p>
                </div>
              ) : (
                <div className="flex gap-2 w-full pt-2">
                  {!isClockedIn ? (
                    <>
                      <button
                        onClick={() => handleCheckIn(false)}
                        className="flex-1 py-3 px-4 rounded-2xl text-xs font-semibold text-white bg-green-600 hover:bg-green-700 transition-all shadow-sm hover:shadow"
                      >
                        Clock In Onsite
                      </button>
                      <button
                        onClick={() => handleCheckIn(true)}
                        className="flex-1 py-3 px-4 rounded-2xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-all shadow-sm hover:shadow"
                      >
                        Clock In Remote
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCheckOut}
                      className="w-full py-3 px-4 rounded-2xl text-xs font-semibold text-white bg-slate-700 hover:bg-slate-800 transition-all shadow-sm hover:shadow"
                    >
                      Clock Out Shift
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* AI Insight Summary */}
            <div className="card p-6 flex flex-col justify-between">
              <div>
                <h3 className="section-heading mb-3">AI Attendance Advisor</h3>
                {insights?.insights?.length > 0 ? (
                  <ul className="space-y-2.5 text-xs text-slate-600">
                    {insights.insights.slice(0, 3).map((obs, idx) => (
                      <li key={idx} className="flex gap-2 items-start bg-slate-50 border p-2.5 rounded-xl">
                        <span className="text-amber-500">💡</span>
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">Your attendance shows no anomalies. Keep up the consistent schedule!</p>
                )}
              </div>
              <div className="mt-4 p-3 bg-brand-50 border border-brand-100 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <span className="text-brand-800 font-bold block">Current Health Assessment:</span>
                  <span className="text-[10px] text-brand-600 uppercase tracking-wider font-semibold">Risk Level: {insights?.riskLevel || 'Low'}</span>
                </div>
                <span className="text-xl">🛡️</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="space-y-6">
          {/* Main Action widget */}
          <div className="grid md:grid-cols-[1.5fr_2.5fr] gap-6 items-start">
            <div className="card p-6 text-center space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Attendance Desk console</h3>
              <p className="text-xs text-slate-500">
                Log onsite or remote work hours daily. AI flags will automatically track anomalies.
              </p>
              
              <div className="p-4 bg-slate-50 rounded-2xl border flex flex-col items-center">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Shift Status</span>
                <span className={`text-sm font-semibold mt-1 capitalize px-3 py-1 rounded-full ${
                  isClockedIn ? 'bg-emerald-100 text-emerald-800' : isClockedOut ? 'bg-slate-100 text-slate-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isClockedIn ? 'In Progress' : isClockedOut ? 'Completed' : 'Not Clocked In'}
                </span>
              </div>

              {!isClockedOut && (
                <div className="flex flex-col gap-2 pt-2">
                  {!isClockedIn ? (
                    <>
                      <button
                        onClick={() => handleCheckIn(false)}
                        className="py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-green-600 hover:bg-green-700 transition"
                      >
                        Clock In Onsite
                      </button>
                      <button
                        onClick={() => handleCheckIn(true)}
                        className="py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition"
                      >
                        Clock In Remote
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCheckOut}
                      className="py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-slate-700 hover:bg-slate-800 transition"
                    >
                      Clock Out Shift
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Attendance Logs Table */}
            <div className="card overflow-hidden">
              <h3 className="font-bold p-4 border-b text-sm text-slate-800">Shift History Log</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Time Logged (In/Out)</th>
                      <th className="p-3 text-left">Hours</th>
                      <th className="p-3 text-left">Location / Type</th>
                      <th className="p-3 text-left">AI Integrity Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a) => {
                      const checkInTime = a.checkIn ? new Date(a.checkIn).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—';
                      const checkOutTime = a.checkOut ? new Date(a.checkOut).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—';

                      return (
                        <tr key={a._id} className="border-t">
                          <td className="p-3 font-medium text-slate-700">{new Date(a.date).toLocaleDateString()}</td>
                          <td className="p-3 text-slate-500">{checkInTime} - {checkOutTime}</td>
                          <td className="p-3 font-semibold">{a.hoursWorked ? `${a.hoursWorked} hrs` : '—'}</td>
                          <td className="p-3 capitalize">
                            <div className="flex flex-col gap-1">
                              <span className={`px-2 py-0.5 rounded w-max text-[10px] font-medium ${
                                a.status === 'remote' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {a.status}
                              </span>
                              {a.locationMethod === 'gps' && a.checkInLocation && (
                                <span className="text-[9px] text-slate-400 font-mono tracking-tighter">
                                  {a.checkInLocation.lat.toFixed(4)}, {a.checkInLocation.lng.toFixed(4)}
                                </span>
                              )}
                              {a.locationMethod === 'bypass' && a.status === 'present' && (
                                <span className="text-[9px] text-amber-500 font-mono tracking-tighter">
                                  No GPS Provided
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 capitalize">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              a.aiFlag === 'anomaly' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {a.aiFlag}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {!attendance.length && (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-slate-500">No shift history found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'payroll' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">Disbursement Period</th>
                <th className="p-3 text-left">Base salary</th>
                <th className="p-3 text-left">Taxes / Deductions</th>
                <th className="p-3 text-left">Allowances</th>
                <th className="p-3 text-left">Net Pay</th>
                <th className="p-3 text-left">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {payroll.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="p-3 font-medium">{p.month}</td>
                  <td className="p-3">${p.baseSalary?.toLocaleString()}</td>
                  <td className="p-3 text-rose-600">${p.deductions?.toLocaleString()}</td>
                  <td className="p-3 text-emerald-600">${p.allowances?.toLocaleString()}</td>
                  <td className="p-3 font-bold text-emerald-700">${p.netPay?.toLocaleString()}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold capitalize">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!payroll.length && (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-slate-500">No payroll records released.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'performance' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">My Performance Reviews</h2>
          {performance.map((p) => (
            <div key={p._id} className="card p-5 space-y-3">
              <div className="flex justify-between items-center border-b pb-3">
                <span className="font-bold text-slate-800">{p.period} Review</span>
                <span className="px-3.5 py-1 bg-brand-100 text-brand-850 rounded-full text-xs font-bold">
                  Score: {p.rating}/5
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                <strong>Feedback:</strong> {p.feedback}
              </p>
              {p.goals?.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-2xl border text-xs">
                  <strong className="block text-slate-500 uppercase tracking-wider mb-2">Assigned Goals:</strong>
                  <ul className="list-disc ml-5 space-y-1 text-slate-700 font-semibold">
                    {p.goals.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}
              {p.aiSummary && (
                <div className="p-3 bg-brand-50 border border-brand-100 rounded-2xl text-xs leading-relaxed">
                  <strong className="text-brand-855 block mb-1">🤖 AI Insights Summary:</strong>
                  <p className="text-brand-900">{p.aiSummary}</p>
                </div>
              )}
              {p.aiRecommendations?.length > 0 && (
                <div className="text-xs">
                  <strong className="text-slate-400 block uppercase tracking-wider mb-1">🤖 Recommendations for growth:</strong>
                  <ul className="list-disc ml-5 space-y-1 text-slate-500">
                    {p.aiRecommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {!performance.length && (
            <p className="text-slate-500 text-sm">No performance reviews issued.</p>
          )}
        </div>
      )}

      {tab === 'leave' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="section-heading mb-4">Request Leave</h2>
            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Leave type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="input-field animate-fade-in"
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
                  rows={3}
                  className="input-field"
                  placeholder="Provide details for manager review"
                />
              </div>
              <button
                type="submit"
                disabled={leaveSubmitting}
                className="btn btn-primary w-full py-3 text-sm"
              >
                {leaveSubmitting ? 'Submitting request...' : 'Submit Leave Request'}
              </button>
            </form>
          </div>
          
          <div className="card p-6">
            <h2 className="section-heading mb-4">My Leave History</h2>
            <div className="space-y-3">
              {leaveRequests.map((leave) => (
                <div key={leave._id} className="rounded-2xl border bg-slate-50 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-900 capitalize">{leave.type} leave</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()} ({leave.days} days)
                      </p>
                    </div>
                    <span
                      className={`px-3.5 py-1 rounded-full text-xs font-semibold border ${
                        leave.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : leave.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}
                    >
                      {leave.status}
                    </span>
                  </div>
                  {leave.reason && <p className="text-sm text-slate-600 mt-2 italic">"{leave.reason}"</p>}
                  {leave.managerComment && (
                    <div className="mt-2 text-xs border-t pt-2 text-slate-500">
                      <strong>Manager Note:</strong> {leave.managerComment}
                    </div>
                  )}
                </div>
              ))}
              {!leaveRequests.length && (
                <p className="text-sm text-slate-500">No leave requests submitted.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'profile' && (
        <div className="card p-6 max-w-2xl">
          <h2 className="section-heading mb-4">Manage Profile</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="input-field"
                  placeholder="+1 (555) 019-2834"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <input
                  type="text"
                  value={profileLocation}
                  onChange={(e) => setProfileLocation(e.target.value)}
                  className="input-field"
                  placeholder="San Francisco, CA"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn URL</label>
              <input
                type="url"
                value={profileLinkedin}
                onChange={(e) => setProfileLinkedin(e.target.value)}
                className="input-field"
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Short Bio</label>
              <textarea
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                rows={3}
                className="input-field"
                placeholder="Brief professional background..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Skills (comma-separated)</label>
              <input
                type="text"
                value={profileSkills}
                onChange={(e) => setProfileSkills(e.target.value)}
                className="input-field"
                placeholder="React, Node.js, SQL, AWS"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Work Experience Summary</label>
              <textarea
                value={profileExperience}
                onChange={(e) => setProfileExperience(e.target.value)}
                rows={3}
                className="input-field"
                placeholder="Describe your previous experience..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Education</label>
              <textarea
                value={profileEducation}
                onChange={(e) => setProfileEducation(e.target.value)}
                rows={2}
                className="input-field"
                placeholder="Degrees, universities, courses..."
              />
            </div>

            <button
              type="submit"
              disabled={profileSubmitting}
              className="btn btn-primary w-full py-3 text-sm"
            >
              {profileSubmitting ? 'Saving changes...' : 'Update Profile'}
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
}
