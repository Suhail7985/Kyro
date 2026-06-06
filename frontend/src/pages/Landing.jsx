import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Users, Video, BarChart, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';

export default function Landing() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-brand-500 selection:text-white overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-brand-900/30 to-transparent pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
              K
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Kyro</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="relative group px-5 py-2 text-sm font-medium text-white bg-white/10 rounded-full border border-white/20 hover:bg-white/20 transition-all">
              <span className="relative z-10 flex items-center gap-2">
                Get Started <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 max-w-7xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>The Next Generation HRMS Platform</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8">
            <span className="block text-white">Hire Smarter.</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400">
              Manage Better.
            </span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg sm:text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
            Kyro is an AI-powered platform that automates resume screening, conducts video interviews, and streamlines your entire workforce management in real-time.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all">
              Start Free Trial
            </Link>
            <Link to="/careers" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors">
              View Open Jobs
            </Link>
          </motion.div>
        </motion.div>

        {/* Dashboard Mockup Reveal */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="mt-20 relative mx-auto max-w-5xl rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-2 shadow-2xl shadow-indigo-500/10"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
          <div className="rounded-xl overflow-hidden border border-white/5 bg-slate-950 flex flex-col">
            <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
              <div className="h-32 rounded-lg bg-white/5 border border-white/5 p-4 space-y-3">
                <div className="w-1/3 h-4 rounded bg-indigo-500/50" />
                <div className="w-2/3 h-3 rounded bg-white/10" />
                <div className="w-1/2 h-3 rounded bg-white/10" />
              </div>
              <div className="h-32 rounded-lg bg-white/5 border border-white/5 p-4 space-y-3">
                <div className="w-1/3 h-4 rounded bg-violet-500/50" />
                <div className="w-full h-3 rounded bg-white/10" />
                <div className="w-3/4 h-3 rounded bg-white/10" />
              </div>
              <div className="h-32 rounded-lg bg-white/5 border border-white/5 p-4 space-y-3">
                <div className="w-1/3 h-4 rounded bg-purple-500/50" />
                <div className="w-1/2 h-3 rounded bg-white/10" />
                <div className="w-5/6 h-3 rounded bg-white/10" />
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Features Section */}
      <section className="py-24 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to scale</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Built for modern HR teams. From finding the right candidate to managing their performance years later.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Brain className="w-6 h-6 text-indigo-400" />}
              title="AI Resume Screening"
              desc="Automatically extract skills and rank candidates based on job requirements using Gemini AI."
            />
            <FeatureCard 
              icon={<Video className="w-6 h-6 text-violet-400" />}
              title="Video Interviews"
              desc="Record and review asynchronous candidate video pitches without leaving the dashboard."
            />
            <FeatureCard 
              icon={<Users className="w-6 h-6 text-purple-400" />}
              title="Real-Time Kanban"
              desc="Drag and drop candidates through hiring stages with live socket updates across your team."
            />
            <FeatureCard 
              icon={<BarChart className="w-6 h-6 text-emerald-400" />}
              title="Advanced Analytics"
              desc="Track hiring velocity, attendance rates, and employee performance with Redis-backed speed."
            />
            <FeatureCard 
              icon={<CheckCircle2 className="w-6 h-6 text-blue-400" />}
              title="Leave & Attendance"
              desc="Streamline time-off requests, daily check-ins, and managerial approvals."
            />
            <FeatureCard 
              icon={<Sparkles className="w-6 h-6 text-pink-400" />}
              title="Role-Based Portals"
              desc="Personalized dashboards for Admins, Managers, Recruiters, and Employees."
            />
          </div>
        </div>
      </section>

      {/* Stats / CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="rounded-[2.5rem] bg-gradient-to-br from-indigo-900/40 to-violet-900/20 border border-white/10 p-12 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">Ready to transform your HR?</h2>
            <p className="text-indigo-200 mb-10 max-w-xl mx-auto text-lg">Join forward-thinking companies that are automating their recruitment and workforce management.</p>
            <Link to="/register" className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-slate-950 font-bold hover:bg-slate-100 transition-colors shadow-xl shadow-white/10">
              Create your free workspace
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950 py-12 text-center">
        <p className="text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Kyro HRMS. Built with ❤️ for the Hackathon.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
    >
      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm">
        {desc}
      </p>
    </motion.div>
  );
}
