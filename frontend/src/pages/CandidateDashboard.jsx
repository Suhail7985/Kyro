import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { jobsAPI, applicationsAPI } from '../services/api';

function ScoreBadge({ score }) {
  const color =
    score >= 70 ? 'bg-green-100 text-green-800' : score >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {score ?? '—'}%
    </span>
  );
}

export default function CandidateDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState('');

  const load = async () => {
    setLoadError('');
    try {
      const [jobsRes, appsRes] = await Promise.all([
        jobsAPI.list(),
        applicationsAPI.list(),
      ]);
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot reach the API. Start the backend on port 5000.'
          : 'Failed to load jobs');
      setLoadError(msg);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedJob || !resumeFile) return;
    setUploading(true);
    setMessage('');
    try {
      await applicationsAPI.uploadResume(selectedJob, resumeFile);
      setMessage('Resume uploaded and AI-scored successfully!');
      setResumeFile(null);
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout title="Candidate Dashboard">
      {loadError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{loadError}</div>
      )}
      {message && (
        <div className="mb-4 p-3 bg-brand-50 text-brand-800 rounded-lg text-sm">{message}</div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Apply to a Job</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Job</label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">
                  {jobs.length ? 'Choose a position...' : 'No open jobs available'}
                </option>
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.title}
                  </option>
                ))}
              </select>
              {!jobs.length && !loadError && (
                <p className="text-xs text-slate-500 mt-1">
                  Jobs are posted by recruiters. Demo jobs load automatically when the database is
                  empty — restart the backend if you just updated, or log in as recruiter@hiring.com
                  to add more.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Resume (PDF/DOCX)</label>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => setResumeFile(e.target.files[0])}
                required
                className="w-full text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading & scoring...' : 'Upload Resume'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Open Positions</h2>
          <ul className="space-y-3 max-h-64 overflow-y-auto">
            {jobs.map((j) => (
              <li key={j._id} className="p-3 bg-slate-50 rounded-lg">
                <p className="font-medium">{j.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {(j.requiredSkills || []).slice(0, 5).join(' · ')}
                </p>
              </li>
            ))}
            {!jobs.length && <p className="text-slate-500 text-sm">No open jobs yet.</p>}
          </ul>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <h2 className="text-lg font-semibold p-6 border-b">My Applications</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-4">Job</th>
                <th className="text-left p-4">AI Score</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Video</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app._id} className="border-t">
                  <td className="p-4 font-medium">{app.jobId?.title}</td>
                  <td className="p-4">
                    <ScoreBadge score={app.score} />
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{app.status}</span>
                  </td>
                  <td className="p-4">{app.videoUrl ? '✓ Uploaded' : '—'}</td>
                  <td className="p-4">
                    <Link
                      to={`/interview/${app._id}`}
                      className="text-brand-600 hover:underline text-sm"
                    >
                      {app.videoUrl ? 'Re-record' : 'Record interview'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!applications.length && (
            <p className="p-6 text-slate-500 text-sm">No applications yet. Upload a resume above.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
