import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <nav className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-brand-100 text-brand-700 text-xl font-bold shadow-sm">
              K
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Kyro</p>
              <p className="text-sm text-slate-500">AI-powered HRMS platform</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/login" className="btn btn-ghost px-5 py-2 text-sm font-semibold">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary px-5 py-2 text-sm font-semibold">
              Get Started
            </Link>
          </div>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.9fr] items-start">
          <section className="space-y-8">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] font-semibold text-brand-600 mb-4">
                Intelligent hiring, simplified
              </p>
              <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight">
                Transform hiring with AI-assisted sourcing, interviewing, and HR operations.
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-slate-600 leading-8">
                Kyro helps recruiters, managers, and candidates move faster with smarter decisions, better matching, and a seamless candidate experience.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="btn btn-primary px-6 py-3 text-sm">
                Start your free demo
              </Link>
              <Link to="/login" className="btn btn-secondary px-6 py-3 text-sm">
                Sign in
              </Link>
            </div>
          </section>

          <section className="card p-8 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-semibold text-brand-600 mb-4">
                Hire smarter today
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Access AI-powered job matching, interview question generation, leave approvals, attendance insights, and performance analytics.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-semibold text-slate-900">Resume screening</p>
                <p className="text-sm text-slate-500 mt-1">Analyze applications and rank candidates automatically.</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">Interview automation</p>
                <p className="text-sm text-slate-500 mt-1">Generate targeted questions and collect video responses.</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">HR workflows</p>
                <p className="text-sm text-slate-500 mt-1">Manage leaves, attendance, payroll, and performance in one place.</p>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          <div className="card p-8">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">AI Resume Screening</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Quickly identify top candidates by matching resumes to job requirements using AI.
            </p>
          </div>
          <div className="card p-8">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Analytics Dashboard</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Track hiring velocity, attendance trends, and performance metrics across your team.
            </p>
          </div>
          <div className="card p-8">
            <div className="text-4xl mb-4">📹</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Video Interviews</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Record candidate responses and make faster decisions with context-rich interviews.
            </p>
          </div>
        </section>

        <section className="mt-16 rounded-[32px] bg-slate-900 p-10 text-white shadow-xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="text-5xl font-bold">5+</p>
              <p className="mt-2 text-sm text-slate-300">AI capabilities</p>
            </div>
            <div>
              <p className="text-5xl font-bold">4</p>
              <p className="mt-2 text-sm text-slate-300">Role-based views</p>
            </div>
            <div>
              <p className="text-5xl font-bold">Realtime</p>
              <p className="mt-2 text-sm text-slate-300">insights & actions</p>
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-200 py-8 text-center text-slate-500">
        &copy; 2026 Kyro. Built for modern hiring teams.
      </footer>
    </div>
  );
}
