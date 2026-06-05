import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { usersAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function Onboarding() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    phone: user?.profile?.phone || '',
    location: user?.profile?.location || '',
    linkedin: user?.profile?.linkedin || '',
    bio: user?.profile?.bio || '',
    experience: user?.profile?.experience || '',
    education: user?.profile?.education || '',
    skills: (user?.profile?.skills || []).join(', '),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await usersAPI.updateProfile({
        ...form,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        onboardingComplete: true,
      });
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard/employee');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Candidate Onboarding">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] max-w-5xl mx-auto">
        <div className="card p-8">
          <p className="text-slate-600 mb-4">
            Complete your candidate profile so recruiters can evaluate your skills and experience quickly.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="font-semibold mb-2">Profile completion</p>
              <p className="text-slate-500">Boost your match rate and unlock AI job recommendations.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="font-semibold mb-2">Recruiter visibility</p>
              <p className="text-slate-500">A richer profile helps your application stand out.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="font-semibold mb-2">Career guidance</p>
              <p className="text-slate-500">AI recommendations are personalized from your skills.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="font-semibold mb-2">Faster hiring</p>
              <p className="text-slate-500">Complete profiles get reviewed first.</p>
            </div>
          </div>
        </div>

        <div className="card p-8">
          {error && <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-field"
                  placeholder="0800 123 456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="input-field"
                  placeholder="Remote / City, Country"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn profile</label>
              <input
                value={form.linkedin}
                onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                className="input-field"
                placeholder="https://linkedin.com/in/yourname"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className="input-field"
                placeholder="Describe your skills, role, and what you’re looking for."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Experience</label>
              <textarea
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                rows={3}
                className="input-field"
                placeholder="3 years in software development, recruiting, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Education</label>
              <input
                value={form.education}
                onChange={(e) => setForm({ ...form, education: e.target.value })}
                className="input-field"
                placeholder="BSc Computer Science"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Skills</label>
              <input
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                placeholder="React, Python, Machine Learning"
                className="input-field"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-sm"
            >
              {loading ? 'Saving profile...' : 'Complete onboarding'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
