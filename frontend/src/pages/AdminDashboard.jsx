import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIChatBot from '../components/AIChatBot';
import StatCard from '../components/StatCard';
import { hrAPI } from '../services/api';
import {
  StatusPieChart,
  SkillsBarChart,
  ScoreDistributionChart,
} from '../components/AnalyticsCharts';
import { statsAPI, usersAPI } from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([statsAPI.get(), usersAPI.list(), hrAPI.companyDashboard()])
      .then(([s, u, c]) => {
        setStats(s.data);
        setUsers(u.data);
        setCompany(c.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    await usersAPI.delete(id);
    setUsers(users.filter((u) => u._id !== id));
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

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0 },
    { label: 'Open Jobs', value: stats?.totalJobs ?? 0 },
    { label: 'Applications', value: stats?.totalApplications ?? 0 },
    { label: 'Avg AI Score', value: `${stats?.avgScore ?? 0}%` },
    { label: 'Shortlisted', value: stats?.shortlisted ?? 0 },
    { label: 'Rejected', value: stats?.rejected ?? 0 },
  ];

  return (
    <Layout title="Management Admin — Company & Individual Analytics">
      <AIChatBot />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} />
        ))}
        <StatCard label="Present today" value={company?.presentToday ?? 0} />
        <StatCard label="Payroll total" value={`$${(company?.totalPayrollDisbursed || 0).toLocaleString()}`} />
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
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

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <h2 className="font-semibold p-4 border-b">User Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-xs capitalize">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="text-xs text-red-600 hover:underline"
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
    </Layout>
  );
}
