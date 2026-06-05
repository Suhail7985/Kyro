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
  const [stats, setStats] = useState(null);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);

  useEffect(() => {
    Promise.all([statsAPI.get(), hrAPI.companyDashboard(), hrAPI.employees(), hrAPI.pendingLeaves()])
      .then(([s, c, e, leaves]) => {
        setStats(s.data);
        setCompany(c.data);
        setEmployees(e.data);
        setPendingLeaves(leaves.data);
      })
      .catch(console.error);
  }, []);

  return (
    <Layout title="Senior Manager — Company Dashboard">
      <AIChatBot />
      <p className="text-slate-600 text-sm mb-6 -mt-4">
        Company-wide analytics plus your team overview. Designed for 5,000+ employee scale with
        indexed queries and pagination-ready APIs.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
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

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3">Hiring pipeline</h3>
          <StatusPieChart statusBreakdown={stats?.statusBreakdown} />
        </div>
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3">Top skills (BI view)</h3>
          <SkillsBarChart topSkills={stats?.topSkills} />
        </div>
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3">AI score distribution</h3>
          <ScoreDistributionChart scoreDistribution={stats?.scoreDistribution} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border overflow-hidden">
          <h2 className="font-semibold p-4 border-b">Pending leave requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left">Employee</th>
                  <th className="p-3 text-left">Type / Days</th>
                  <th className="p-3 text-left">Dates</th>
                  <th className="p-3 text-left">Reason</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaves.map((leave) => (
                  <tr key={leave._id} className="border-t">
                    <td className="p-3">{leave.userId?.name || 'Unknown'}</td>
                    <td className="p-3">
                      {leave.type} • {leave.days} day{leave.days === 1 ? '' : 's'}
                    </td>
                    <td className="p-3">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-3">{leave.reason || 'N/A'}</td>
                  </tr>
                ))}
                {!pendingLeaves.length && (
                  <tr>
                    <td colSpan="4" className="p-4 text-sm text-slate-500">
                      No pending leave requests at the moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <h2 className="font-semibold p-4 border-b">Workforce by department</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Designation</th>
                <th className="p-3 text-left">Employee ID</th>
              </tr>
            </thead>
            <tbody>
              {employees.slice(0, 50).map((e) => (
                <tr key={e._id} className="border-t">
                  <td className="p-3">{e.name}</td>
                  <td className="p-3">{e.department || '—'}</td>
                  <td className="p-3">{e.designation || '—'}</td>
                  <td className="p-3">{e.employeeId || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </Layout>
  );
}
