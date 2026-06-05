import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIChatBot from '../components/AIChatBot';
import { jobsAPI, applicationsAPI, mediaUrl } from '../services/api';

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [applications, setApplications] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    location: '',
    salary: '',
  });
  const [questions, setQuestions] = useState([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    jobsAPI.list({ createdBy: 'me' }).then((r) => setJobs(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    applicationsAPI.list({ job: selectedJob }).then((r) => setApplications(r.data));
    setQuestions([]);
    setQuestionError('');
  }, [selectedJob]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await jobsAPI.create({
        ...newJob,
        requiredSkills: newJob.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setJobs([res.data, ...jobs]);
      setShowCreate(false);
      setNewJob({ title: '', description: '', requiredSkills: '', location: '', salary: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    await applicationsAPI.updateStatus(id, status);
    const r = await applicationsAPI.list({ job: selectedJob });
    setApplications(r.data);
  };

  const generateInterviewQuestions = async () => {
    if (!selectedJob) return;
    setQuestionError('');
    setQuestionLoading(true);
    try {
      const res = await jobsAPI.generateQuestions(selectedJob);
      setQuestions(res.data.questions || []);
    } catch (err) {
      setQuestionError(err.response?.data?.message || 'Failed to generate questions');
    } finally {
      setQuestionLoading(false);
    }
  };

  const bulkRescore = async () => {
    if (!selectedJob) return;
    setLoading(true);
    try {
      await applicationsAPI.bulkScore(selectedJob);
      const r = await applicationsAPI.list({ job: selectedJob });
      setApplications(r.data);
      alert('Bulk AI rescoring complete');
    } catch (err) {
      alert(err.response?.data?.message || 'Bulk score failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="HR Recruiter Dashboard">
      <AIChatBot />
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn btn-primary px-5 py-3 text-sm"
        >
          {showCreate ? 'Cancel' : '+ Post New Job'}
        </button>
        {selectedJob && (
          <>
            <button
              onClick={bulkRescore}
              disabled={loading}
              className="btn btn-secondary px-5 py-3 text-sm text-white bg-slate-700 border-transparent hover:bg-slate-800 disabled:opacity-50"
            >
              Bulk AI Rescore
            </button>
            <button
              onClick={generateInterviewQuestions}
              disabled={questionLoading}
              className="btn btn-primary px-5 py-3 text-sm"
            >
              {questionLoading ? 'Generating...' : 'Generate Interview Questions'}
            </button>
          </>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreateJob} className="mb-8 card p-6 space-y-4">
          <h2 className="section-heading">Create Job Posting</h2>
          <input
            placeholder="Job Title"
            value={newJob.title}
            onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
            required
            className="input-field"
          />
          <textarea
            placeholder="Description"
            value={newJob.description}
            onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
            required
            rows={4}
            className="input-field"
          />
          <input
            placeholder="Required skills (comma-separated)"
            value={newJob.requiredSkills}
            onChange={(e) => setNewJob({ ...newJob, requiredSkills: e.target.value })}
            className="input-field"
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              placeholder="Location"
              value={newJob.location}
              onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
              className="input-field"
            />
            <input
              placeholder="Salary range"
              value={newJob.salary}
              onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
              className="input-field"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary py-3 text-sm w-full">
            Publish Job
          </button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-4">
          <h2 className="section-heading">Your Jobs</h2>
          <ul className="space-y-2">
            {jobs.map((j) => (
              <li key={j._id}>
                <button
                  onClick={() => setSelectedJob(j._id)}
                  className={`w-full text-left p-3 rounded-2xl text-sm transition ${
                    selectedJob === j._id
                      ? 'bg-brand-100 text-brand-800 font-semibold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {j.title}
                </button>
              </li>
            ))}
            {!jobs.length && <p className="text-slate-500 text-sm">Post your first job above.</p>}
          </ul>
        </div>

        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="section-heading">Applicants</h2>
              <p className="text-sm text-slate-500">Sorted by AI score for faster review.</p>
            </div>
            {selectedJob && <p className="text-sm text-slate-500">Selected job ID: {selectedJob}</p>}
          </div>
          {!selectedJob ? (
            <p className="p-6 text-slate-500 text-sm">Select a job to view applicants.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3">Candidate</th>
                    <th className="text-left p-3">Score</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Media</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app._id} className="border-t">
                      <td className="p-3">
                        <p className="font-medium text-slate-900">{app.extractedName || app.userId?.name}</p>
                        <p className="text-xs text-slate-500">{app.extractedEmail || app.userId?.email}</p>
                        {app.aiFeedback && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">{app.aiFeedback}</p>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-brand-600">{app.score}%</span>
                        {app.missingSkills?.length > 0 && (
                          <p className="text-xs text-red-500 mt-1">Missing: {app.missingSkills.join(', ')}</p>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="badge uppercase tracking-[0.12em]">{app.status}</span>
                      </td>
                      <td className="p-3 space-y-1">
                        {app.resumeUrl && (
                          <a
                            href={mediaUrl(app.resumeUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-brand-600 text-xs hover:underline"
                          >
                            Resume
                          </a>
                        )}
                        {app.videoUrl && (
                          <a
                            href={mediaUrl(app.videoUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-brand-600 text-xs hover:underline"
                          >
                            Watch Video
                          </a>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => updateStatus(app._id, 'Shortlisted')}
                            className="btn btn-secondary px-3 py-2 text-xs"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => updateStatus(app._id, 'Rejected')}
                            className="btn btn-secondary px-3 py-2 text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!applications.length && (
                <p className="p-6 text-slate-500 text-sm">No applicants for this job yet.</p>
              )}
            </div>
          )}
          {questions.length > 0 && (
            <div className="bg-slate-50 border-t p-4">
              <h3 className="font-semibold mb-3">Generated Interview Questions</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {questions.map((question, index) => (
                  <div key={index} className="rounded-2xl border bg-white p-3 text-sm text-slate-700">
                    <span className="font-medium">Q{index + 1}.</span> {question}
                  </div>
                ))}
              </div>
            </div>
          )}
          {questionError && (
            <div className="p-4 text-sm text-red-700 bg-red-50">
              {questionError}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
