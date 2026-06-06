import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { applicantsAuthAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await applicantsAuthAPI.register(form);
      setSuccessMessage(res.data.message || 'Registration successful! Please check your email to verify your account.');
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
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>

          {successMessage ? (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-4">Verify your email</h1>
              <p className="text-slate-500 leading-relaxed max-w-md mb-8">
                {successMessage}
              </p>
              <Link to="/login" className="btn btn-primary px-8 py-3 text-sm">
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm uppercase tracking-[0.25em] font-semibold text-brand-600 mb-4">Join the network</p>
              <h1 className="text-4xl font-bold text-slate-900 mb-4">Start your journey with Kyro</h1>
              <p className="text-slate-500 leading-relaxed">
                Create a candidate profile to apply for open positions, record video responses, and track your applications.
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
                    placeholder="jane@example.com"
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
                <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-sm">
                  {loading ? 'Creating account...' : 'Register'}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-sm text-slate-500">
            Already signed up?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="hidden lg:flex flex-col justify-between gap-6 bg-gradient-to-br from-brand-600 to-brand-700 p-10 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-200 mb-4">Kyro for Candidates</p>
            <ul className="space-y-4 text-sm leading-7">
              <li>• Apply to open roles instantly with your resume</li>
              <li>• Take AI-guided video interviews on your schedule</li>
              <li>• Track your application status in real-time</li>
              <li>• Receive personalized feedback and matching insights</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
