import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIChatBot from '../components/AIChatBot';
import ApplicantKanbanBoard from '../components/ApplicantKanbanBoard';
import { jobsAPI, applicationsAPI, mediaUrl } from '../services/api';

export default function RecruiterDashboard() {
  const [tab, setTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [applications, setApplications] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  
  // Job Form states
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    location: '',
    salary: '',
    department: 'Engineering',
    employmentType: 'full-time',
    experienceRequired: 2,
    workType: 'hybrid',
  });
  
  // Video player modal state
  const [activeVideoUrl, setActiveVideoUrl] = useState('');
  const [activeVideoTitle, setActiveVideoTitle] = useState('');

  const [questions, setQuestions] = useState([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadJobs = async () => {
    try {
      const r = await jobsAPI.list({ createdBy: 'me' });
      setJobs(r.data || []);
      if (r.data?.length > 0 && !selectedJob) {
        setSelectedJob(r.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const loadApplications = async () => {
    if (!selectedJob) return;
    try {
      const r = await applicationsAPI.list({ job: selectedJob });
      setApplications(r.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadApplications();
    setQuestions([]);
    setQuestionError('');
    // Also pre-fetch questions if they are stored in the job
    if (selectedJob) {
      const job = jobs.find((j) => j._id === selectedJob);
      if (job?.interviewQuestions) {
        setQuestions(job.interviewQuestions);
      }
    }
  }, [selectedJob, jobs]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await jobsAPI.create({
        ...newJob,
        requiredSkills: newJob.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        experienceRequired: Number(newJob.experienceRequired),
      });
      setJobs([res.data, ...jobs]);
      setSelectedJob(res.data._id);
      setShowCreate(false);
      setNewJob({
        title: '',
        description: '',
        requiredSkills: '',
        location: '',
        salary: '',
        department: 'Engineering',
        employmentType: 'full-time',
        experienceRequired: 2,
        workType: 'hybrid',
      });
      setMessage('Job published successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await applicationsAPI.updateStatus(appId, newStatus);
      await loadApplications();
      setMessage(`Application status updated to "${newStatus}"`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const generateInterviewQuestions = async () => {
    if (!selectedJob) return;
    setQuestionError('');
    setQuestionLoading(true);
    try {
      const res = await jobsAPI.generateQuestions(selectedJob);
      setQuestions(res.data.questions || []);
      setMessage('Role-specific questions generated and saved.');
      // Refresh jobs list to keep in sync
      await loadJobs();
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
      await loadApplications();
      setMessage('Bulk AI scoring matching completed.');
    } catch (err) {
      alert(err.response?.data?.message || 'Bulk score failed');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'jobs', label: 'Post & Manage Jobs' },
    { id: 'applicants', label: 'Applicant Pipeline & Screening' },
    { id: 'interviews', label: 'Interview Management' },
    { id: 'reports', label: 'Hiring Reports' },
  ];

  // Pipeline Status values
  const pipelineStatuses = [
    'applied',
    'screening',
    'shortlisted',
    'interview',
    'recruiter_review',
    'manager_review',
    'selected',
    'rejected',
  ];

  return (
    <Layout title="HR Recruiter Dashboard">
      <AIChatBot />

      {message && (
        <div className="mb-4 p-3 bg-brand-50 text-brand-800 rounded-lg text-sm">{message}</div>
      )}

      {/* Tabs navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
              tab === t.id ? 'bg-brand-600 text-white shadow-md' : 'bg-white border text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Select Job drop down at the top for context */}
      {jobs.length > 0 && tab !== 'jobs' && (
        <div className="card p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Selected Job Context:</span>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="input-field py-1 px-3 text-sm max-w-sm"
            >
              {jobs.map((j) => (
                <option key={j._id} value={j._id}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </div>
          {selectedJob && (
            <div className="flex gap-2">
              <button
                onClick={bulkRescore}
                disabled={loading}
                className="px-4 py-1.5 bg-slate-700 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition disabled:opacity-50"
              >
                Bulk AI Rescore
              </button>
              <button
                onClick={generateInterviewQuestions}
                disabled={questionLoading}
                className="px-4 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700 transition"
              >
                {questionLoading ? 'Generating...' : 'Generate Questions'}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'jobs' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Active Job Listings</h2>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="btn btn-primary px-4 py-2 text-sm"
            >
              {showCreate ? 'Close Form' : '+ Post Job'}
            </button>
          </div>

          {showCreate && (
            <form onSubmit={handleCreateJob} className="card p-6 space-y-4 max-w-3xl">
              <h3 className="font-semibold text-slate-800">Job Posting Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  placeholder="Job Title"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  required
                  className="input-field"
                />
                <input
                  placeholder="Department"
                  value={newJob.department}
                  onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <textarea
                placeholder="Job Description"
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                required
                rows={4}
                className="input-field"
              />

              <div className="grid sm:grid-cols-3 gap-4">
                <select
                  value={newJob.employmentType}
                  onChange={(e) => setNewJob({ ...newJob, employmentType: e.target.value })}
                  className="input-field"
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>

                <select
                  value={newJob.workType}
                  onChange={(e) => setNewJob({ ...newJob, workType: e.target.value })}
                  className="input-field"
                >
                  <option value="hybrid">Hybrid</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">Onsite</option>
                </select>

                <input
                  type="number"
                  placeholder="Experience Required (Years)"
                  value={newJob.experienceRequired}
                  onChange={(e) => setNewJob({ ...newJob, experienceRequired: e.target.value })}
                  className="input-field"
                  min="0"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  placeholder="Location"
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  className="input-field"
                />
                <input
                  placeholder="Salary (e.g. $120,000 - $140,000)"
                  value={newJob.salary}
                  onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                  className="input-field"
                />
              </div>

              <input
                placeholder="Required skills (comma-separated)"
                value={newJob.requiredSkills}
                onChange={(e) => setNewJob({ ...newJob, requiredSkills: e.target.value })}
                className="input-field"
              />

              <button type="submit" disabled={loading} className="btn btn-primary py-3 text-sm w-full">
                Publish Job Listing
              </button>
            </form>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((j) => (
              <div
                key={j._id}
                onClick={() => setSelectedJob(j._id)}
                className={`card p-5 cursor-pointer border transition hover:shadow-md ${
                  selectedJob === j._id ? 'border-brand-500 bg-brand-50/20 shadow-sm' : 'border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">{j.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{j.department} • {j.location}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    j.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {j.status}
                  </span>
                </div>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] capitalize">{j.employmentType}</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] capitalize">{j.workType}</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">{j.experienceRequired} yrs exp</span>
                </div>
              </div>
            ))}
            {!jobs.length && (
              <p className="text-slate-500 text-sm py-4">No job postings created. Click '+ Post Job' to start.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'applicants' && (
        <div className="card overflow-hidden p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-semibold text-lg text-slate-900">Candidate Pipeline</h2>
              <p className="text-sm text-slate-500">Drag and drop candidates across pipeline stages.</p>
            </div>
            {applications.length > 0 && (
              <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-bold">
                {applications.length} Total Applicants
              </span>
            )}
          </div>
          
          <ApplicantKanbanBoard 
            applications={applications} 
            onStatusChange={handleStatusChange}
            onPlayVideo={(url, title) => {
              setActiveVideoUrl(mediaUrl(url));
              setActiveVideoTitle(title);
            }}
          />
        </div>
      )}

      {tab === 'interviews' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card p-5">
            <h2 className="section-heading mb-4">Interview Questions</h2>
            {questions.length > 0 ? (
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={idx} className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">
                    <span className="font-semibold block text-brand-600 mb-1">Question {idx + 1}</span>
                    {typeof q === 'object' ? (q.question || q.text || JSON.stringify(q)) : q}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-500 mb-4">No interview questions generated for this job opening.</p>
                <button
                  onClick={generateInterviewQuestions}
                  disabled={questionLoading || !selectedJob}
                  className="btn btn-primary text-xs w-full py-2"
                >
                  {questionLoading ? 'Generating Questions...' : 'Generate Questions with AI'}
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 card p-5">
            <h2 className="section-heading mb-4">Applicant Video Responses</h2>
            <div className="space-y-4">
              {applications.filter((a) => a.interviewVideos && a.interviewVideos.length > 0).map((app) => (
                <div key={app._id} className="rounded-2xl border p-4 bg-slate-50 space-y-3">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{app.extractedName || app.userId?.name}</h3>
                      <p className="text-xs text-slate-500">{app.interviewVideos.length} response video(s) uploaded</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {app.interviewVideos.map((vid, idx) => (
                      <div key={vid._id || idx} className="bg-white p-4 rounded-xl border text-xs flex flex-col justify-between">
                        <div className="space-y-2">
                          <strong className="block text-brand-600 mb-1">Q: {vid.question || 'Interview Question'}</strong>
                          <p className="text-slate-400">Duration: {vid.videoDuration || '60'}s</p>

                          {vid.videoAnalysis && (
                            <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5 text-[11px] leading-relaxed">
                              <p className="text-slate-700 font-medium"><span className="text-brand-600">Transcript:</span> "{vid.videoAnalysis.transcript}"</p>
                              <div className="flex gap-3 text-slate-500 font-semibold mt-1 flex-wrap">
                                <span>🎯 AI Score: {vid.videoAnalysis.confidenceScore}%</span>
                                <span>🗣️ Tone: {vid.videoAnalysis.toneAnalysis}</span>
                              </div>
                              {vid.videoAnalysis.matchingKeywords?.length > 0 && (
                                <p className="text-slate-500 font-medium"><span className="text-brand-600">Keywords:</span> {vid.videoAnalysis.matchingKeywords.join(', ')}</p>
                              )}
                              <p className="text-slate-500 italic"><span className="text-brand-600 font-semibold">Feedback:</span> {vid.videoAnalysis.overallFeedback}</p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setActiveVideoUrl(mediaUrl(vid.videoUrl));
                            setActiveVideoTitle(`${app.extractedName || app.userId?.name} — Answer ${idx + 1}`);
                          }}
                          className="mt-4 w-full py-1.5 bg-brand-50 text-brand-600 font-semibold rounded-lg text-center hover:bg-brand-100 transition"
                        >
                          Play Video Answer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!applications.some((a) => a.interviewVideos && a.interviewVideos.length > 0) && (
                <p className="text-slate-500 text-sm">No interview videos uploaded yet for this job opening.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="card p-5 text-center">
            <h3 className="text-sm font-semibold text-slate-500">Average Screening Score</h3>
            <p className="text-3xl font-bold text-brand-600 mt-2">
              {applications.length > 0
                ? Math.round(applications.reduce((acc, a) => acc + a.score, 0) / applications.length)
                : 0}%
            </p>
          </div>
          <div className="card p-5 text-center">
            <h3 className="text-sm font-semibold text-slate-500">Total Applicants</h3>
            <p className="text-3xl font-bold text-slate-800 mt-2">{applications.length}</p>
          </div>
          <div className="card p-5 text-center">
            <h3 className="text-sm font-semibold text-slate-500">Pending Review</h3>
            <p className="text-3xl font-bold text-amber-600 mt-2">
              {applications.filter((a) => ['applied', 'screening'].includes(a.status)).length}
            </p>
          </div>
          <div className="card p-5 text-center">
            <h3 className="text-sm font-semibold text-slate-500">Shortlisted</h3>
            <p className="text-3xl font-bold text-emerald-600 mt-2">
              {applications.filter((a) => a.status === 'shortlisted').length}
            </p>
          </div>
        </div>
      )}

      {/* Video Player Overlay Modal */}
      {activeVideoUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold text-slate-900">{activeVideoTitle}</h3>
              <button
                onClick={() => {
                  setActiveVideoUrl('');
                  setActiveVideoTitle('');
                }}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 bg-slate-900 aspect-video flex items-center justify-center">
              <video src={activeVideoUrl} controls autoPlay className="max-h-full max-w-full" />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
