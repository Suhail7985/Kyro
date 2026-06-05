import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import VideoRecorder from '../components/VideoRecorder';
import { useAuth } from '../hooks/useAuth';
import api, { jobsAPI, applicationsAPI, applicantsAuthAPI, mediaUrl } from '../services/api';

// Helper to determine AI score color classes
function getScoreColor(score) {
  if (score >= 70) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', fill: 'bg-emerald-500' };
  if (score >= 40) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', fill: 'bg-amber-500' };
  return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', fill: 'bg-rose-500' };
}

// Helper to determine status color classes
function getStatusColor(status) {
  const s = status?.toLowerCase();
  if (s === 'selected' || s === 'shortlisted' || s === 'onboarding') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  }
  if (s === 'rejected') {
    return 'bg-rose-50 text-rose-700 border-rose-100';
  }
  if (s === 'interview') {
    return 'bg-violet-50 text-violet-700 border-violet-100';
  }
  return 'bg-blue-50 text-blue-700 border-blue-100';
}

export default function CandidateDashboard() {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState('overview');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Profile Form states
  const [profilePhone, setProfilePhone] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [profileLinkedin, setProfileLinkedin] = useState('');
  const [profilePortfolio, setProfilePortfolio] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileSkills, setProfileSkills] = useState('');
  const [profileExperience, setProfileExperience] = useState('');
  const [profileEducation, setProfileEducation] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Apply Modal states
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyingJob, setApplyingJob] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Modals for Detail Views
  const [jobDetailOpen, setJobDetailOpen] = useState(false);
  const [detailJob, setDetailJob] = useState(null);
  const [appDetailOpen, setAppDetailOpen] = useState(false);
  const [detailApp, setDetailApp] = useState(null);

  // AI Interview specific states
  const [selectedInterviewApp, setSelectedInterviewApp] = useState(null);
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // General UI states
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4500);
  };

  const load = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [jobsRes, appsRes, profileRes] = await Promise.all([
        jobsAPI.list(),
        applicationsAPI.list(),
        applicantsAuthAPI.me(),
      ]);
      setJobs(jobsRes.data || []);
      setApplications(appsRes.data || []);
      
      const appProfile = profileRes.data.applicant || {};
      setSavedJobIds((appProfile.savedJobs || []).map(j => j._id || j));
      
      // Update local storage / user profile state
      if (user) {
        const updatedUser = { ...user, ...appProfile, role: 'applicant' };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      setLoadError(
        err.response?.data?.message || 'Failed to load candidate portal data'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Sync profile form values when user changes
  useEffect(() => {
    if (user) {
      setProfilePhone(user.phone || '');
      setProfileLocation(user.location || '');
      setProfileLinkedin(user.linkedin || '');
      setProfilePortfolio(user.portfolio || '');
      setProfileBio(user.bio || '');
      setProfileSkills((user.profile?.skills || []).join(', '));
      setProfileExperience(user.profile?.experience || '');
      setProfileEducation(user.profile?.education || '');
      setMfaEnabled(user.mfaEnabled || false);
    }
  }, [user]);

  const handleSaveToggle = async (jobId) => {
    try {
      const res = await jobsAPI.toggleSave(jobId);
      if (res.data.saved) {
        setSavedJobIds([...savedJobIds, jobId]);
        showToast('Job added to saved list.');
      } else {
        setSavedJobIds(savedJobIds.filter(id => id !== jobId));
        showToast('Job removed from saved list.');
      }
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handleApplyClick = (job) => {
    setApplyingJob(job);
    setResumeFile(null);
    setApplyModalOpen(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyingJob || !resumeFile) return;
    setUploadingResume(true);
    try {
      await applicationsAPI.uploadResume(applyingJob._id, resumeFile);
      showToast(`Applied for ${applyingJob.title}! Automatic AI screening complete.`);
      setApplyModalOpen(false);
      setApplyingJob(null);
      setResumeFile(null);
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Resume upload failed', 'error');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSubmitting(true);
    try {
      const skillsArray = profileSkills.split(',').map(s => s.trim()).filter(Boolean);
      const res = await applicantsAuthAPI.updateProfile({
        phone: profilePhone,
        location: profileLocation,
        linkedin: profileLinkedin,
        portfolio: profilePortfolio,
        bio: profileBio,
        profile: {
          skills: skillsArray,
          experience: profileExperience,
          education: profileEducation,
        },
      });
      setUser({ ...user, ...res.data.applicant, role: 'applicant' });
      showToast('Profile updated successfully.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Profile update failed', 'error');
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleVideoUpload = async () => {
    if (!selectedInterviewApp || !recordedVideo) return;
    const questionsList = selectedInterviewApp.jobId?.interviewQuestions || [
      'Tell us about your most challenging project and how you overcame it.',
      'What is your approach to problem-solving in complex scenarios?',
      'Describe a time when you had to learn a new technology quickly.',
    ];
    const questionText = questionsList[selectedQuestionIdx];
    const questionId = `q_${selectedQuestionIdx + 1}`;

    setUploadingVideo(true);
    try {
      await applicationsAPI.uploadVideo(selectedInterviewApp._id, recordedVideo, {
        questionId,
        question: questionText,
        applicationId: selectedInterviewApp._id,
      });
      showToast(`Answer to Question ${selectedQuestionIdx + 1} uploaded successfully!`);
      setRecordedVideo(null);
      
      // Reload applications to refresh video status
      await load();
      
      // Select updated app from new list
      const updatedApps = await applicationsAPI.list();
      const updatedApp = updatedApps.data.find(a => a._id === selectedInterviewApp._id);
      setSelectedInterviewApp(updatedApp || null);
      
      // Go to next question if available
      if (selectedQuestionIdx < questionsList.length - 1) {
        setSelectedQuestionIdx(selectedQuestionIdx + 1);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Video upload failed', 'error');
    } finally {
      setUploadingVideo(false);
    }
  };

  // Compute stat counts
  const statSubmitted = applications.length;
  const statShortlisted = applications.filter(
    (a) => ['shortlisted', 'selected', 'onboarding'].includes(a.status?.toLowerCase())
  ).length;
  const statInterviews = applications.filter((a) => a.status?.toLowerCase() === 'interview').length;
  const statOpenJobs = jobs.filter((j) => j.status === 'open').length;

  const departments = [...new Set(jobs.map((j) => j.department).filter(Boolean))];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.requiredSkills || []).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = !selectedDept || job.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const savedJobs = jobs.filter((job) => savedJobIds.includes(job._id));

  // Applications eligible for video interview
  const interviewApps = applications.filter((a) => ['interview', 'shortlisted', 'applied', 'screening'].includes(a.status?.toLowerCase()));

  // Active status tracker step indices
  const getPipelineStepIndex = (status) => {
    const steps = ['applied', 'screening', 'interview', 'recruiter_review', 'manager_review', 'selected'];
    const idx = steps.indexOf(status?.toLowerCase());
    return idx >= 0 ? idx : 0;
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'jobs', label: 'Browse Jobs' },
    { id: 'applications', label: 'My Applications' },
    { id: 'interviews', label: 'AI Interviews' },
    { id: 'saved', label: `Saved Jobs (${savedJobIds.length})` },
    { id: 'profile', label: 'My Profile' },
  ];

  return (
    <Layout title={`Kyro Career Portal — ${user?.name || 'Applicant'}`}>
      {/* Toast Alert */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center p-4 rounded-2xl shadow-xl border transition-all duration-300 transform translate-y-0 ${
          toast.type === 'error' 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="mr-3">
            {toast.type === 'error' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p className="text-sm font-semibold">{toast.message}</p>
        </div>
      )}

      {loadError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl flex items-center gap-3">
          <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm font-medium">{loadError}</span>
        </div>
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

      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Applications Submitted" value={statSubmitted} />
            <StatCard label="Shortlisted" value={statShortlisted} />
            <StatCard label="Interviews Pending" value={statInterviews} />
            <StatCard label="Open Positions" value={statOpenJobs} />
          </div>

          <div className="grid lg:grid-cols-[1.6fr_1.4fr] gap-8">
            <div className="card p-6 space-y-4">
              <h2 className="section-heading">Kyro Onboarding Introduction</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Welcome to our modern talent acquisition portal. Kyro uses fully automated AI resume matching to screen applications instantly. 
                Once your resume matches the job description, you can immediately record video responses for role-specific interview questions.
              </p>
              <div className="p-4 bg-brand-50 rounded-2xl border border-brand-100 flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div className="text-xs text-brand-900 leading-relaxed">
                  <strong>Fast Track Tip:</strong> Keep your skills updated in your candidate profile to receive better job recommendations and match rankings.
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="section-heading mb-4">Latest Application Updates</h2>
              <div className="space-y-3">
                {applications.slice(0, 3).map((app) => (
                  <div key={app._id} className="rounded-2xl border bg-slate-50 p-4 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-800">{app.jobId?.title}</p>
                      <p className="text-slate-400 mt-1">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full uppercase text-[10px] font-bold border ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                ))}
                {!applications.length && (
                  <p className="text-sm text-slate-500 py-4">No applications submitted yet. Browse jobs to start.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'jobs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Browse Open Positions</h2>
              <p className="text-slate-500 text-xs mt-0.5">Explore active hiring listings & apply instantly</p>
            </div>
            
            <div className="flex w-full sm:w-auto gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs, skills, location..."
                className="w-full sm:w-60 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
              
              {departments.length > 0 && (
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none"
                >
                  <option value="">All Fields</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-slate-50 border rounded-2xl p-6 animate-pulse space-y-3 h-48"></div>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <p className="text-center text-slate-500 py-12">No jobs found matching search filters.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredJobs.map((job) => {
                const isRemote = job.location?.toLowerCase().includes('remote') || job.workType?.toLowerCase() === 'remote';
                const hasApplied = applications.some((app) => app.jobId?._id === job._id);
                const isSaved = savedJobIds.includes(job._id);

                return (
                  <div key={job._id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex flex-wrap gap-2 items-center">
                            <h3
                              onClick={() => { setDetailJob(job); setJobDetailOpen(true); }}
                              className="text-base font-bold text-slate-800 hover:text-brand-600 cursor-pointer transition"
                            >
                              {job.title}
                            </h3>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                              Actively Hiring
                            </span>
                            {isRemote && (
                              <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full text-[10px] font-bold border border-sky-100">
                                Remote
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{job.department} · {job.location || 'Anywhere'}</p>
                        </div>

                        <button
                          onClick={() => handleSaveToggle(job._id)}
                          className={`p-1.5 rounded-xl border transition ${
                            isSaved ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <svg className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                      </div>

                      <div className="my-4 bg-slate-50 p-3 rounded-xl text-xs text-slate-600 border border-slate-100 flex justify-between gap-2 flex-wrap">
                        <span><strong>Experience:</strong> {job.experienceRequired !== undefined ? `${job.experienceRequired} yrs` : 'Entry'}</span>
                        <span><strong>Type:</strong> <span className="capitalize">{job.workType}</span></span>
                        <span><strong>Salary:</strong> {job.salary || 'Competitive'}</span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {(job.requiredSkills || []).slice(0, 4).map((skill, index) => (
                          <span key={index} className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-600">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t">
                      <button
                        onClick={() => { setDetailJob(job); setJobDetailOpen(true); }}
                        className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleApplyClick(job)}
                        disabled={hasApplied}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
                          hasApplied
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
                        }`}
                      >
                        {hasApplied ? 'Applied' : 'Apply Now'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'applications' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">My Applications</h2>
          
          {applications.map((app) => {
            const currentStep = getPipelineStepIndex(app.status);
            const scoreMeta = getScoreColor(app.score);

            return (
              <div key={app._id} className="card p-5 space-y-4">
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{app.jobId?.title || 'Job Listing'}</h3>
                    <p className="text-xs text-slate-500 mt-1">Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 ${scoreMeta.bg} ${scoreMeta.text} rounded text-xs font-bold border ${scoreMeta.border}`}>
                      AI Score: {app.score}%
                    </span>
                    <span className={`px-2.5 py-1 rounded-full uppercase text-[10px] font-bold border ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                </div>

                {/* Progress bar pipeline */}
                <div className="py-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span className={currentStep >= 0 ? 'text-brand-600' : ''}>Applied</span>
                    <span className={currentStep >= 1 ? 'text-brand-600' : ''}>Screening</span>
                    <span className={currentStep >= 2 ? 'text-brand-600' : ''}>Interview</span>
                    <span className={currentStep >= 3 ? 'text-brand-600' : ''}>Recruiter Review</span>
                    <span className={currentStep >= 4 ? 'text-brand-600' : ''}>Manager Review</span>
                    <span className={currentStep >= 5 ? 'text-brand-600' : ''}>Selected</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 transition-all duration-500"
                      style={{ width: `${(Math.max(0, currentStep) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { setDetailApp(app); setAppDetailOpen(true); }}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    View AI Match Details
                  </button>
                  {app.status?.toLowerCase() === 'interview' && (
                    <button
                      onClick={() => {
                        setSelectedInterviewApp(app);
                        setSelectedQuestionIdx(0);
                        setTab('interviews');
                      }}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold"
                    >
                      Start AI Video Interview
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {!applications.length && (
            <p className="text-slate-500 text-sm">No applications submitted yet.</p>
          )}
        </div>
      )}

      {tab === 'interviews' && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1.6fr]">
          <div className="card p-5 space-y-4">
            <h2 className="section-heading">Select Application to Interview</h2>
            
            <div className="space-y-2">
              {interviewApps.map((app) => (
                <div
                  key={app._id}
                  onClick={() => {
                    setSelectedInterviewApp(app);
                    setSelectedQuestionIdx(0);
                    setRecordedVideo(null);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    selectedInterviewApp?._id === app._id
                      ? 'border-violet-500 bg-violet-50/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <h3 className="font-semibold text-slate-900">{app.jobId?.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">Status: {app.status}</p>
                </div>
              ))}
              {!interviewApps.length && (
                <p className="text-sm text-slate-500">No applications ready for interview.</p>
              )}
            </div>
          </div>

          {selectedInterviewApp ? (
            <div className="card p-6 space-y-5">
              <h2 className="text-base font-bold text-slate-800">
                AI Video Interview: {selectedInterviewApp.jobId?.title}
              </h2>
              
              {/* Question list selection */}
              {(() => {
                const questionsList = selectedInterviewApp.jobId?.interviewQuestions || [
                  'Tell us about your most challenging project and how you overcame it.',
                  'What is your approach to problem-solving in complex scenarios?',
                  'Describe a time when you had to learn a new technology quickly.',
                ];
                
                return (
                  <div className="space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b">
                      {questionsList.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedQuestionIdx(idx);
                            setRecordedVideo(null);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                            selectedQuestionIdx === idx ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Q{idx + 1}
                        </button>
                      ))}
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <strong className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Question {selectedQuestionIdx + 1}:</strong>
                      <p className="text-sm font-semibold text-slate-800">{questionsList[selectedQuestionIdx]}</p>
                    </div>

                    {/* Check if video response already exists for this index */}
                    {(() => {
                      const existingVid = selectedInterviewApp.interviewVideos?.find(v => v.questionId === `q_${selectedQuestionIdx + 1}`);
                      
                      return (
                        <div className="space-y-4">
                          {existingVid ? (
                            <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl text-xs space-y-2">
                              <p className="font-semibold">✓ You have already uploaded a response for this question.</p>
                              <a
                                href={mediaUrl(existingVid.videoUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block text-brand-600 font-bold hover:underline"
                              >
                                Play uploaded response
                              </a>
                            </div>
                          ) : null}

                          <p className="text-xs text-slate-500 leading-relaxed">
                            Position your camera, click "Record" to answer the question, and then click "Upload Video" to save your response.
                          </p>

                          <VideoRecorder onRecorded={(file) => setRecordedVideo(file)} disabled={uploadingVideo} />

                          {recordedVideo && (
                            <div className="flex gap-2">
                              <button
                                onClick={handleVideoUpload}
                                disabled={uploadingVideo}
                                className="flex-1 py-3 bg-violet-600 text-white rounded-xl text-xs font-semibold hover:bg-violet-700 transition"
                              >
                                {uploadingVideo ? 'Uploading response...' : 'Upload Video Answer'}
                              </button>
                              <button
                                onClick={() => setRecordedVideo(null)}
                                className="px-4 py-3 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50"
                              >
                                Reset
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="card p-6 flex items-center justify-center text-slate-400 text-sm h-64 border-dashed border-2">
              Select an application on the left to start the AI video interview.
            </div>
          )}
        </div>
      )}

      {tab === 'saved' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Saved Jobs</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {savedJobs.map((job) => (
              <div key={job._id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-800">{job.title}</h3>
                    <button
                      onClick={() => handleSaveToggle(job._id)}
                      className="text-xs text-rose-600 hover:underline font-semibold"
                    >
                      Unsave
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{job.department} · {job.location}</p>
                </div>
                <button
                  onClick={() => { setDetailJob(job); setJobDetailOpen(true); }}
                  className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
                >
                  View Job Details
                </button>
              </div>
            ))}
            {!savedJobs.length && (
              <p className="text-slate-500 text-sm py-4">No saved jobs. Click the bookmark icon on jobs to save them.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'profile' && (
        <div className="card p-6 max-w-2xl">
          <h2 className="section-heading mb-4">Edit Candidate Profile</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="input-field"
                  placeholder="+1 (555) 012-3456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <input
                  type="text"
                  value={profileLocation}
                  onChange={(e) => setProfileLocation(e.target.value)}
                  className="input-field"
                  placeholder="New York, NY"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn Link</label>
                <input
                  type="url"
                  value={profileLinkedin}
                  onChange={(e) => setProfileLinkedin(e.target.value)}
                  className="input-field"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Portfolio Link</label>
                <input
                  type="url"
                  value={profilePortfolio}
                  onChange={(e) => setProfilePortfolio(e.target.value)}
                  className="input-field"
                  placeholder="https://github.com/username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Short Bio</label>
              <textarea
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                rows={3}
                className="input-field"
                placeholder="A short tagline about your skills and goals..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Skills (comma-separated)</label>
              <input
                type="text"
                value={profileSkills}
                onChange={(e) => setProfileSkills(e.target.value)}
                className="input-field"
                placeholder="React, Node.js, Python, SQL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Work Experience Summary</label>
              <textarea
                value={profileExperience}
                onChange={(e) => setProfileExperience(e.target.value)}
                rows={3}
                className="input-field"
                placeholder="Mention previous jobs, roles, and highlights..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Education</label>
              <textarea
                value={profileEducation}
                onChange={(e) => setProfileEducation(e.target.value)}
                rows={2}
                className="input-field"
                placeholder="Degrees and academic credentials..."
              />
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between my-4">
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Two-Factor Authentication (MFA)</h4>
                <p className="text-xs text-slate-500 mt-1">Require a 6-digit OTP code sent via email upon logging in to secure your account.</p>
              </div>
              <input
                type="checkbox"
                checked={mfaEnabled}
                onChange={async (e) => {
                  const nextVal = e.target.checked;
                  try {
                    const res = await applicantsAuthAPI.toggleMfa(nextVal);
                    setMfaEnabled(res.data.mfaEnabled);
                    showToast(res.data.message);
                    
                    const updatedUser = { ...user, mfaEnabled: res.data.mfaEnabled };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                  } catch (err) {
                    showToast('Failed to toggle MFA', 'error');
                  }
                }}
                className="w-4.5 h-4.5 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={profileSubmitting}
              className="btn btn-primary w-full py-3 text-sm"
            >
              {profileSubmitting ? 'Saving Profile...' : 'Save Candidate Profile'}
            </button>
          </form>
        </div>
      )}

      {/* Apply Resume Upload Modal */}
      {applyModalOpen && applyingJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-semibold text-slate-900">Apply: {applyingJob.title}</h3>
              <button
                onClick={() => setApplyModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Upload Resume (PDF, DOCX)</label>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  required
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
              </div>
              <button
                type="submit"
                disabled={uploadingResume}
                className="btn btn-primary w-full py-3 text-sm"
              >
                {uploadingResume ? 'AI Resume Screening...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {jobDetailOpen && detailJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{detailJob.title}</h3>
                <p className="text-xs text-slate-500">{detailJob.department} · {detailJob.location}</p>
              </div>
              <button
                onClick={() => setJobDetailOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div>
                <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider mb-1">Description:</h4>
                <p className="leading-relaxed text-xs">{detailJob.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border rounded-2xl text-xs">
                <div>
                  <span className="text-slate-400 block">Experience Required:</span>
                  <span className="font-semibold">{detailJob.experienceRequired !== undefined ? `${detailJob.experienceRequired} years` : 'Entry'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Workplace Type:</span>
                  <span className="font-semibold capitalize">{detailJob.workType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Employment Type:</span>
                  <span className="font-semibold capitalize">{detailJob.employmentType || 'Full-time'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Salary Range:</span>
                  <span className="font-semibold">{detailJob.salary || 'Competitive'}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider mb-2">Required Skills:</h4>
                <div className="flex flex-wrap gap-1">
                  {(detailJob.requiredSkills || []).map((sk, i) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">{sk}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application AI Match Details Modal */}
      {appDetailOpen && detailApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900">AI Screening Results</h3>
              <button
                onClick={() => setAppDetailOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center bg-brand-50 p-4 border border-brand-100 rounded-2xl">
                <div>
                  <p className="font-bold text-brand-800 text-sm">Match Score</p>
                  <p className="text-[10px] text-brand-600 mt-0.5">Calculated by resume-to-JD parser</p>
                </div>
                <span className="text-3xl font-extrabold text-brand-700">{detailApp.score}%</span>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 uppercase tracking-wider mb-2">Matched Skills:</h4>
                <div className="flex flex-wrap gap-1">
                  {detailApp.matchedSkills?.length > 0 ? (
                    detailApp.matchedSkills.map((sk, i) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[11px] font-semibold">{sk}</span>
                    ))
                  ) : (
                    <span className="text-slate-400">No matching skills found</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 uppercase tracking-wider mb-2">Missing Skills:</h4>
                <div className="flex flex-wrap gap-1">
                  {detailApp.missingSkills?.length > 0 ? (
                    detailApp.missingSkills.map((sk, i) => (
                      <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[11px] font-semibold">{sk}</span>
                    ))
                  ) : (
                    <span className="text-slate-400 font-semibold text-emerald-700">None! You meet all skills criteria.</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 uppercase tracking-wider mb-1">AI Recommendation Feedback:</h4>
                <p className="text-slate-600 leading-relaxed text-[11px] italic bg-slate-50 border p-3 rounded-2xl">
                  "{detailApp.aiFeedback || 'No feedback available.'}"
                </p>
              </div>
              
              {detailApp.recruiterFeedback && (
                <div className="border-t pt-3">
                  <h4 className="font-semibold text-slate-900 uppercase tracking-wider mb-1">Recruiter Review Remarks:</h4>
                  <p className="text-slate-600 leading-relaxed text-[11px] bg-slate-50 p-2.5 rounded-xl">
                    {detailApp.recruiterFeedback}
                  </p>
                </div>
              )}

              {detailApp.managerFeedback && (
                <div className="border-t pt-3">
                  <h4 className="font-semibold text-slate-900 uppercase tracking-wider mb-1">Manager Review Remarks:</h4>
                  <p className="text-slate-600 leading-relaxed text-[11px] bg-slate-50 p-2.5 rounded-xl">
                    {detailApp.managerFeedback}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
