import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      login(res.data.token, res.data.user);
      const role = res.data.user.role;
      const paths = {
        admin: '/dashboard/admin',
        senior_manager: '/dashboard/manager',
        hr_recruiter: '/dashboard/recruiter',
      };
      navigate(paths[role] || '/dashboard/employee');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 px-4 py-10">
      <div className="w-full max-w-4xl grid gap-8 lg:grid-cols-[1.1fr_0.9fr] overflow-hidden rounded-[32px] shadow-2xl bg-white">
        <div className="p-10 lg:p-14">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-600 mb-3">Welcome back</p>
            <h1 className="text-4xl font-bold text-slate-900">Sign in to Kyro</h1>
            <p className="mt-3 text-slate-500">Access your personalized HR dashboard and AI-powered workflows.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-sm">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            New here?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <div className="hidden lg:flex flex-col justify-between gap-6 bg-gradient-to-br from-brand-600 to-brand-700 p-10 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-200 mb-4">Kyro Benefits</p>
            <ul className="space-y-4 text-sm">
              <li>• AI-powered talent scoring</li>
              <li>• Interview question generation</li>
              <li>• Leave requests and payroll management</li>
              <li>• Role-specific dashboards</li>
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
