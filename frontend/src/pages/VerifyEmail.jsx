import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { applicantsAuthAPI } from '../services/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    applicantsAuthAPI
      .verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.data?.message || 'Email verified successfully! You can now sign in.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification link is invalid or has expired.');
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl p-8 lg:p-12 text-center">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        {status === 'verifying' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-6"></div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifying your email</h1>
            <p className="text-slate-500">Please wait while we confirm your credentials...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Email Verified!</h1>
            <p className="text-slate-500 leading-relaxed mb-8">{message}</p>
            <Link to="/login" className="btn btn-primary w-full py-3 text-sm">
              Sign In
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Verification Failed</h1>
            <p className="text-red-500 leading-relaxed mb-8">{message}</p>
            <Link to="/login" className="btn btn-secondary w-full py-3 text-sm mb-3">
              Go to Login
            </Link>
            <Link to="/register" className="text-xs font-semibold text-slate-500 hover:text-brand-600 transition">
              Try Registering Again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
