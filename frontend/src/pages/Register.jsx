import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      login(res.data.token, res.data.user);
      navigate(
        form.role === 'hr_recruiter' ? '/dashboard/recruiter' : '/onboarding'
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 px-4 py-10">
      <div className="w-full max-w-5xl grid overflow-hidden rounded-[32px] bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-10 lg:p-14">
          <p className="text-sm uppercase tracking-[0.25em] font-semibold text-brand-600 mb-4">Create your account</p>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Start hiring with Kyro</h1>
          <p className="text-slate-500 leading-relaxed">
            Register as an employee or recruiter to access role-based dashboards, AI interview workflows, and HR tools.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="input-field"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="input-field"
                placeholder="jane@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="input-field"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">I am a</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="input-field"
              >
                <option value="employee">Employee</option>
                <option value="hr_recruiter">HR Recruiter</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-sm">
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Already signed up?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="hidden lg:flex flex-col justify-between gap-6 bg-gradient-to-br from-brand-600 to-brand-700 p-10 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-200 mb-4">Why Kyro</p>
            <ul className="space-y-4 text-sm leading-7">
              <li>• Faster hiring with AI screening and scoring</li>
              <li>• Centralized candidate, HR, and payroll workflows</li>
              <li>• Video interview capture and question generation</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-white/10 p-6">
            <p className="text-sm font-semibold text-white">Demo credentials</p>
            <p className="text-xs text-slate-100 mt-3 leading-6">
              Admin: admin@hiring.com / Admin123!<br />Recruiter: recruiter@hiring.com / Recruiter123!<br />Employee: employee@hiring.com / Employee123!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
