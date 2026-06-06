import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIChatBot from '../components/AIChatBot';
import StatCard from '../components/StatCard';
import {
  StatusPieChart,
  SkillsBarChart,
  ScoreDistributionChart,
} from '../components/AnalyticsCharts';
import { hrAPI, statsAPI, adminUsersAPI, recruitmentAPI, applicationsAPI } from '../services/api';

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [company, setCompany] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // User creation form states
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'employee',
    department: 'Engineering',
    designation: 'Software Engineer',
    managerId: '',
    password: '',
  });
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // Department Management list
  const [departments, setDepartments] = useState([
    'Engineering',
    'Product Management',
    'UX Design',
    'Human Resources',
    'Sales & Marketing',
    'Finance & Payroll',
    'Legal & Admin',
  ]);
  const [newDeptName, setNewDeptName] = useState('');

  // Payroll states
  const [payrollMonth, setPayrollMonth] = useState('June 2026');
  const [payrollRunning, setPayrollRunning] = useState(false);

  // Conversion form modal state
  const [conversionApp, setConversionApp] = useState(null);
  const [convForm, setConvForm] = useState({
    department: 'Engineering',
    designation: 'Associate Engineer',
    managerId: '',
  });
  const [convSubmitting, setConvSubmitting] = useState(false);
  const [convertedEmployee, setConvertedEmployee] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, u, c, apps] = await Promise.all([
        statsAPI.get(),
        adminUsersAPI.list(),
        hrAPI.companyDashboard(),
        applicationsAPI.list(),
      ]);
      setStats(s.data);
      setUsers(u.data.users || u.data || []);
      setCompany(c.data);
      setApplications(apps.data || []);
    } catch (err) {
      console.error('Admin dashboard load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await adminUsersAPI.delete(id);
      setUsers(users.filter((u) => u._id !== id));
      setMessage('User deleted successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserSubmitting(true);
    setCreatedCredentials(null);
    try {
      const res = await adminUsersAPI.create(newUser);
      setMessage(`Staff account created for ${res.data.user.name}`);
      setCreatedCredentials(res.data.user);
      setNewUser({
        name: '',
        email: '',
        role: 'employee',
        department: 'Engineering',
        designation: 'Software Engineer',
        managerId: '',
      });
      // Refresh user list
      const u = await adminUsersAPI.list();
      setUsers(u.data.users || u.data || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Create failed');
    } finally {
      setUserSubmitting(false);
    }
  };

  const handleRunPayroll = async (e) => {
    e.preventDefault();
    setPayrollRunning(true);
    try {
      const res = await hrAPI.runPayroll(payrollMonth);
      setMessage(res.data.message || 'Payroll processed successfully.');
      const c = await hrAPI.companyDashboard();
      setCompany(c.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Payroll run failed');
    } finally {
      setPayrollRunning(false);
    }
  };

  const handleAddDepartment = (e) => {
    e.preventDefault();
    if (!newDeptName || departments.includes(newDeptName)) return;
    setDepartments([...departments, newDeptName]);
    setNewDeptName('');
    setMessage(`Department "${newDeptName}" added to the platform.`);
  };

  const handleRemoveDepartment = (dept) => {
    setDepartments(departments.filter((d) => d !== dept));
    setMessage(`Department "${dept}" removed.`);
  };

  const handleConvertSubmit = async (e) => {
    e.preventDefault();
    if (!conversionApp) return;
    setConvSubmitting(true);
    setConvertedEmployee(null);
    try {
      const res = await recruitmentAPI.convertToEmployee(conversionApp._id, {
        department: convForm.department,
        designation: convForm.designation,
        managerId: convForm.managerId || null,
      });
      setConvertedEmployee(res.data.employee);
      setMessage(`Successfully converted selected candidate to Employee ${res.data.employee.employeeId}!`);
      // Reload applications and user lists
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Conversion failed');
    } finally {
      setConvSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <div className="flex justify-center py-20">
          <div className="animate-spin h-10 w-10 border-4 border-brand-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  // Filter selected applications that need conversion
  // Status check: lowercase 'selected'
  const selectedApps = applications.filter((app) => app.status?.toLowerCase() === 'selected' || app.pipelineStatus?.toLowerCase() === 'selected');

  // Managers list for dropdowns
  const managers = users.filter((u) => u.role === 'senior_manager');

  const cards = [
    { label: 'Total staff', value: users.length },
    { label: 'Open Jobs', value: stats?.totalJobs ?? 0 },
    { label: 'Applications', value: stats?.totalApplications ?? 0 },
    { label: 'Avg AI Score', value: `${stats?.avgScore ?? 0}%` },
    { label: 'Shortlisted', value: stats?.shortlisted ?? 0 },
    { label: 'Rejected', value: stats?.rejected ?? 0 },
    { label: 'Present today', value: company?.presentToday ?? 0 },
    { label: 'Payroll total', value: `$${(company?.totalPayrollDisbursed || 0).toLocaleString()}` },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview & Analytics' },
    { id: 'users', label: 'User Management' },
    { id: 'departments', label: 'Department Management' },
    { id: 'payroll', label: 'Payroll & Analytics' },
    { id: 'conversions', label: `Pending Conversions (${selectedApps.length})` },
  ];

  return (
    <Layout title="Management Admin Dashboard">
      <AIChatBot />

      {message && (
        <div className="mb-4 p-3 bg-brand-50 text-brand-800 rounded-lg text-sm">{message}</div>
      )}

      {/* Tabs Menu */}
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {cards.map((c) => (
              <StatCard key={c.label} label={c.label} value={c.value} />
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <h3 className="font-semibold mb-4 text-sm text-slate-600">Application Status</h3>
              <StatusPieChart statusBreakdown={stats?.statusBreakdown} />
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <h3 className="font-semibold mb-4 text-sm text-slate-600">Top Matched Skills</h3>
              <SkillsBarChart topSkills={stats?.topSkills} />
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <h3 className="font-semibold mb-4 text-sm text-slate-600">Score Distribution</h3>
              <ScoreDistributionChart scoreDistribution={stats?.scoreDistribution} />
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card p-6">
            <h2 className="section-heading mb-4">Create Staff Account</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. john@kyro.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Initial Password <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to auto-generate"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role Type</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="input-field"
                >
                  <option value="employee">Employee</option>
                  <option value="hr_recruiter">HR Recruiter</option>
                  <option value="senior_manager">Senior Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                <select
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  className="input-field"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Backend Engineer"
                  value={newUser.designation}
                  onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              {newUser.role === 'employee' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reporting Manager</label>
                  <select
                    value={newUser.managerId}
                    onChange={(e) => setNewUser({ ...newUser, managerId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">No Manager Assigned</option>
                    {managers.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.department})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={userSubmitting}
                className="btn btn-primary w-full py-3 text-sm"
              >
                {userSubmitting ? 'Creating...' : 'Create Account'}
              </button>
            </form>

            {createdCredentials && (
              <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                <strong className="text-amber-800 uppercase tracking-wider block font-semibold">Credentials Generated:</strong>
                <p><strong>Employee:</strong> {createdCredentials.name}</p>
                <p><strong>Email:</strong> {createdCredentials.email}</p>
                <p><strong>Temp Password:</strong> <span className="font-mono bg-white px-2 py-0.5 border rounded select-all font-semibold text-rose-600">{createdCredentials.tempPassword}</span></p>
                <p className="text-[10px] text-slate-400">Share these credentials with the staff member to log in.</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 card overflow-hidden">
            <h2 className="font-semibold p-4 border-b">Active User Accounts</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">Dept & Designation</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-t">
                      <td className="p-3 font-semibold text-slate-800">{u.name}</td>
                      <td className="p-3 text-slate-500">{u.email}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 bg-slate-100 rounded text-xs capitalize">
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-xs">
                        <p className="font-semibold">{u.department || '—'}</p>
                        <p className="text-slate-400">{u.designation || '—'}</p>
                      </td>
                      <td className="p-3">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="text-xs text-rose-600 hover:underline font-semibold"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'departments' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="section-heading mb-4">Add Department</h2>
            <form onSubmit={handleAddDepartment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Department Name</label>
                <input
                  type="text"
                  placeholder="e.g. R&D Team"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
              <button type="submit" className="btn btn-primary w-full py-3 text-sm">
                Add Department
              </button>
            </form>
          </div>

          <div className="card p-6">
            <h2 className="section-heading mb-4">Active Departments</h2>
            <div className="divide-y text-sm text-slate-700">
              {departments.map((dept) => (
                <div key={dept} className="flex justify-between items-center py-2.5">
                  <span className="font-medium">{dept}</span>
                  <button
                    onClick={() => handleRemoveDepartment(dept)}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'payroll' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6 border-emerald-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="section-heading mb-0">Disburse Payroll Payments</h2>
            </div>
            
            <p className="text-sm text-slate-500 mb-6">
              This automated pipeline will calculate taxes and allowances, securely trigger Stripe payouts, and email digital payslips to all active employees.
            </p>

            <form onSubmit={handleRunPayroll} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Payroll Month</label>
                <input
                  type="month"
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                />
              </div>
              
              <button
                type="submit"
                disabled={payrollRunning}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {payrollRunning ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Payouts...
                  </>
                ) : (
                  'Run Payroll & Disburse Funds'
                )}
              </button>
            </form>
          </div>

          <div className="card p-6">
            <h2 className="section-heading mb-4">HR & Hiring Reports</h2>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border rounded-2xl flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-sm">Q2 Recruitment Performance</h4>
                  <p className="text-xs text-slate-400">Aggregated AI scores and screening speeds</p>
                </div>
                <button
                  onClick={() => alert('Hiring reports exported to server log.')}
                  className="px-3.5 py-1.5 bg-brand-50 text-brand-600 rounded-xl text-xs font-semibold hover:bg-brand-100 transition"
                >
                  Download
                </button>
              </div>
              <div className="p-3 bg-slate-50 border rounded-2xl flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-sm">Employee Attendance Summary</h4>
                  <p className="text-xs text-slate-400">Leave days, late check-ins, and active anomalies</p>
                </div>
                <button
                  onClick={() => alert('Attendance metrics compiled.')}
                  className="px-3.5 py-1.5 bg-brand-50 text-brand-600 rounded-xl text-xs font-semibold hover:bg-brand-100 transition"
                >
                  Download
                </button>
              </div>
              <div className="p-3 bg-slate-50 border rounded-2xl flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-sm">Payroll Disbursement Receipts</h4>
                  <p className="text-xs text-slate-400">Total taxes paid, base salary totals, and net payments</p>
                </div>
                <button
                  onClick={() => alert('Payroll report compiled.')}
                  className="px-3.5 py-1.5 bg-brand-50 text-brand-600 rounded-xl text-xs font-semibold hover:bg-brand-100 transition"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'conversions' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
            <h2 className="font-semibold">Selected Candidates Pending Conversion</h2>
            <p className="text-xs text-slate-400 mt-1">
              Convert candidates marked as 'Selected' directly into Employee accounts with generated passwords.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left">Candidate Info</th>
                  <th className="p-3 text-left">Applied Job</th>
                  <th className="p-3 text-left">AI Match Score</th>
                  <th className="p-3 text-left">Selection Date</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedApps.map((app) => (
                  <tr key={app._id} className="border-t">
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">{app.extractedName || app.userId?.name}</p>
                      <p className="text-xs text-slate-500">{app.extractedEmail || app.userId?.email}</p>
                    </td>
                    <td className="p-3 font-medium text-slate-800">{app.jobId?.title || 'Unknown Job'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-xs">
                        {app.score}%
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">
                      {app.selectedDate ? new Date(app.selectedDate).toLocaleDateString() : 'Just Selected'}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setConversionApp(app);
                          setConvertedEmployee(null);
                        }}
                        className="px-4 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition"
                      >
                        Convert to Employee
                      </button>
                    </td>
                  </tr>
                ))}
                {!selectedApps.length && (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-500">
                      No candidates currently marked as 'Selected' in the recruitment pipeline.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Convert to Employee Modal */}
      {conversionApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-semibold text-slate-900">Convert Candidate</h3>
              <button
                onClick={() => setConversionApp(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-slate-600">
              Create an Employee account for <strong>{conversionApp.extractedName || conversionApp.userId?.name}</strong>.
            </p>

            {!convertedEmployee ? (
              <form onSubmit={handleConvertSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                  <select
                    value={convForm.department}
                    onChange={(e) => setConvForm({ ...convForm, department: e.target.value })}
                    className="input-field"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer"
                    value={convForm.designation}
                    onChange={(e) => setConvForm({ ...convForm, designation: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Manager</label>
                  <select
                    value={convForm.managerId}
                    onChange={(e) => setConvForm({ ...convForm, managerId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">No Manager</option>
                    {managers.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.department})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={convSubmitting}
                  className="btn btn-primary w-full py-3 text-sm bg-green-600 hover:bg-green-700"
                >
                  {convSubmitting ? 'Converting...' : 'Confirm Employee Conversion'}
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm space-y-2 mt-2">
                <strong className="text-emerald-800 block">Conversion Complete!</strong>
                <p><strong>Employee ID:</strong> {convertedEmployee.employeeId}</p>
                <p><strong>Email:</strong> {convertedEmployee.email}</p>
                <p><strong>Temp Password:</strong> <span className="font-mono bg-white px-2 py-0.5 border rounded select-all font-semibold text-rose-600">{convertedEmployee.tempPassword}</span></p>
                <button
                  type="button"
                  onClick={() => setConversionApp(null)}
                  className="mt-4 px-4 py-2 bg-slate-700 text-white rounded-xl text-xs w-full font-semibold hover:bg-slate-800 transition"
                >
                  Close Modal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
