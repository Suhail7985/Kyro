import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { dashboardPath, ROLE_LABELS, isEmployee } from '../utils/roles';

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dashPath = dashboardPath(user?.role);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 min-h-[4rem] py-3 sm:py-0">
            <Link to={dashPath} className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 font-bold shadow-sm">
                K
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900 leading-none">Kyro</p>
                <p className="text-xs text-slate-500">{ROLE_LABELS[user?.role] || user?.role}</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-medium text-slate-800">{user?.name}</span>
                <span className="text-xs text-slate-500">{user?.email}</span>
              </div>
              {isEmployee(user?.role) && !user?.profile?.onboardingComplete && (
                <Link
                  to="/onboarding"
                  className="btn btn-secondary px-4 py-2 text-sm"
                >
                  Complete onboarding
                </Link>
              )}
              <button onClick={handleLogout} className="btn btn-secondary px-4 py-2 text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-24 sm:pb-8">
        {title && (
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.24em] text-brand-600 font-semibold mb-2">
              Dashboard
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">{title}</h1>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
