import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, applicantsAuthAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [loginType, setLoginType] = useState('applicant'); // 'applicant' or 'user'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [tempUserId, setTempUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (loginType === 'applicant') {
        const res = await applicantsAuthAPI.login({ email, password });
        if (res.data.mfaRequired) {
          setMfaRequired(true);
          setTempUserId(res.data.userId);
          setLoading(false);
          return;
        }
        localStorage.setItem('userType', 'applicant');
        const applicantUser = { ...res.data.applicant, role: 'applicant' };
        login(res.data.token, applicantUser);
        navigate('/dashboard/candidate');
      } else {
        const res = await authAPI.login({ email, password });
        if (res.data.mfaRequired) {
          setMfaRequired(true);
          setTempUserId(res.data.userId);
          setLoading(false);
          return;
        }
        localStorage.setItem('userType', 'user');
        login(res.data.token, res.data.user);
        const role = res.data.user.role;
        const paths = {
          admin: '/dashboard/admin',
          senior_manager: '/dashboard/manager',
          hr_recruiter: '/dashboard/recruiter',
        };
        navigate(paths[role] || '/dashboard/employee');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (loginType === 'applicant') {
        res = await applicantsAuthAPI.verifyMfa(tempUserId, mfaCode);
        localStorage.setItem('userType', 'applicant');
        const applicantUser = { ...res.data.applicant, role: 'applicant' };
        login(res.data.token, applicantUser);
        navigate('/dashboard/candidate');
      } else {
        res = await authAPI.verifyMfa(tempUserId, mfaCode);
        localStorage.setItem('userType', 'user');
        login(res.data.token, res.data.user);
        const role = res.data.user.role;
        const paths = {
          admin: '/dashboard/admin',
          senior_manager: '/dashboard/manager',
          hr_recruiter: '/dashboard/recruiter',
        };
        navigate(paths[role] || '/dashboard/employee');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 px-4 py-10">
      <div className="w-full max-w-4xl grid gap-8 lg:grid-cols-[1.1fr_0.9fr] overflow-hidden rounded-[32px] shadow-2xl bg-white">
        <div className="p-10 lg:p-14">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-600 mb-3">Welcome back</p>
            <h1 className="text-4xl font-bold text-slate-900">Sign in to Kyro</h1>
            <p className="mt-3 text-slate-500">Access your personalized dashboard and AI-powered workflows.</p>
          </div>

          {/* Login Type Tabs (hide during 2FA) */}
          {!mfaRequired && (
            <div className="flex border-b border-slate-100 mb-6">
              <button
                type="button"
                onClick={() => {
                  setLoginType('applicant');
                  setError('');
                }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${
                  loginType === 'applicant'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Candidate
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginType('user');
                  setError('');
                }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${
                  loginType === 'user'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Employee / Admin
              </button>
            </div>
          )}

          {mfaRequired ? (
            <form onSubmit={handleMfaSubmit} className="space-y-5">
              {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              <p className="text-sm text-slate-500 leading-6">
                We sent a 6-digit verification code to your email. Please check your inbox and enter it below to complete your login.
              </p>
              <div>
                <label htmlFor="mfaCode" className="block text-sm font-medium text-slate-700 mb-2">
                  Verification Code (OTP)
                </label>
                <input
                  id="mfaCode"
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  required
                  maxLength={6}
                  className="input-field text-center text-lg font-bold tracking-[0.25em]"
                  placeholder="000000"
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-sm">
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMfaRequired(false);
                  setMfaCode('');
                  setError('');
                }}
                className="w-full text-center text-xs font-semibold text-slate-500 hover:text-brand-600 transition"
              >
                Back to Login
              </button>
            </form>
          ) : (
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
                  placeholder={loginType === 'applicant' ? 'jane@example.com' : 'employee@hiring.com'}
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
                  // eslint-disable-next-line react/jsx-no-duplicate-props
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-sm">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

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
        </div>
      </div>
    </div>
  );
}
