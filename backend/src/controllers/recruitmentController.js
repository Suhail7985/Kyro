const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { parseResumeBuffer } = require('../utils/parseResume');
const { parseResumeAI } = require('../utils/extractResume');
const { scoreResume } = require('../services/aiScoring');
const { resumeDir } = require('../middleware/upload');

function mapApplicationForFrontend(app) {
  if (!app) return null;
  const appObj = app.toObject ? app.toObject() : app;

  if (appObj.applicantId && typeof appObj.applicantId === 'object') {
    appObj.applicantId = {
      ...appObj.applicantId,
      phone: appObj.applicantId.phone || appObj.applicantId.profile?.phone || '',
      location: appObj.applicantId.location || appObj.applicantId.profile?.location || '',
    };
  }
  if (appObj.userId && typeof appObj.userId === 'object') {
    appObj.userId = {
      ...appObj.userId,
      phone: appObj.userId.phone || appObj.userId.profile?.phone || '',
      location: appObj.userId.location || appObj.userId.profile?.location || '',
    };
  }

  return {
    ...appObj,
    userId: appObj.applicantId || appObj.userId,
    score: appObj.matchScore !== undefined ? appObj.matchScore : appObj.score,
    status: appObj.pipelineStatus || appObj.status,
  };
}

// Applicant - Browse and search jobs
async function browseJobs(req, res) {
  try {
    const { search, location, experience, workType, page = 1, limit = 10 } = req.query;
    const filter = { status: 'open' };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { responsibilities: { $regex: search, $options: 'i' } },
      ];
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (experience) {
      filter.experienceRequired = { $lte: parseInt(experience) };
    }

    if (workType) {
      filter.workType = workType;
    }

    const jobs = await Job.find(filter)
      .populate('createdBy', 'name department')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Job.countDocuments(filter);

    res.json({
      jobs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Applicant - Get job details
async function getJobDetails(req, res) {
  try {
    const job = await Job.findById(req.params.jobId).populate('createdBy', 'name department');

    if (!job || job.status === 'closed') {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Increment view count
    job.viewCount = (job.viewCount || 0) + 1;
    await job.save();

    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Applicant - Apply for job with resume
async function applyJob(req, res) {
  try {
    const { resumeUrl } = req.body;
    if (!req.file && !resumeUrl) {
      return res.status(400).json({ message: 'Resume file or resumeUrl is required' });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job || job.status !== 'open') {
      return res.status(404).json({ message: 'Job not found or closed' });
    }

    const applicant = await User.findById(req.applicant._id);
    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    // Check if already applied
    const existingApp = await Application.findOne({ applicantId: applicant._id, jobId: job._id });
    if (existingApp) {
      return res.status(409).json({ message: 'Already applied for this job' });
    }

    let finalResumeUrl = resumeUrl;
    let text = '';

    if (resumeUrl) {
      // Download the cloud file to parse it
      const response = await fetch(resumeUrl);
      if (!response.ok) {
        return res.status(400).json({ message: 'Failed to retrieve resume from URL' });
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get('content-type') || '';
      const originalname = resumeUrl.split('/').pop() || 'resume.pdf';
      text = await parseResumeBuffer(buffer, contentType, originalname);
    } else {
      // Parse resume from req.file
      text = await parseResumeBuffer(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );

      // Save resume (Cloudinary or local disk fallback)
      const { isCloudinaryConfigured, uploadStream } = require('../utils/cloudinary');
      if (isCloudinaryConfigured()) {
        const uploadResult = await uploadStream(req.file.buffer, 'resumes', 'raw');
        finalResumeUrl = uploadResult.secure_url;
      } else {
        const filename = `${Date.now()}-${req.file.originalname}`;
        const filepath = path.join(resumeDir, filename);
        fs.writeFileSync(filepath, req.file.buffer);
        finalResumeUrl = `/uploads/resumes/${filename}`;
      }
    }

    const parsedResume = await parseResumeAI(text);

    // Update candidate profile fields in User collection
    if (applicant) {
      if (!applicant.profile) applicant.profile = {};
      if (parsedResume.phone && !applicant.profile.phone) applicant.profile.phone = parsedResume.phone;
      if (parsedResume.location && !applicant.profile.location) applicant.profile.location = parsedResume.location;
      if (parsedResume.skills?.length) {
        applicant.profile.skills = Array.from(new Set([...(applicant.profile.skills || []), ...parsedResume.skills]));
      }
      if (parsedResume.experienceSummary && !applicant.profile.experience) applicant.profile.experience = parsedResume.experienceSummary;
      if (parsedResume.educationSummary && !applicant.profile.education) applicant.profile.education = parsedResume.educationSummary;
      
      applicant.markModified('profile');
      await applicant.save();
    }

    // AI Resume Screening
    const scoring = await scoreResume(text, job);

    // Create application
    const application = await Application.create({
      applicantId: applicant._id,
      userId: applicant._id,
      jobId: job._id,
      resumeUrl: finalResumeUrl,
      resumeText: text,
      matchScore: scoring.score,
      score: scoring.score,
      matchedSkills: scoring.matchedSkills,
      missingSkills: scoring.missingSkills,
      aiFeedback: scoring.feedback,
      pipelineStatus: 'screening',
      status: 'screening',
      extractedName: parsedResume.name || applicant.name,
      extractedEmail: parsedResume.email || applicant.email,
    });

    // Increment job applicant count
    job.applicantCount = (job.applicantCount || 0) + 1;
    await job.save();

    res.status(201).json({
      message: 'Application submitted successfully',
      application: mapApplicationForFrontend(application),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Applicant - View my applications
async function myApplications(req, res) {
  try {
    const applications = await Application.find({ applicantId: req.applicant._id })
      .populate('jobId', 'title department location salary employmentType currency status interviewQuestions');

    const mapped = applications.map((app) => ({
      _id: app._id,
      jobId: app.jobId,
      status: app.pipelineStatus,
      appliedAt: app.createdAt,
      resumeUrl: app.resumeUrl,
      score: app.matchScore,
      videoUrl: app.interviewVideos && app.interviewVideos.length > 0 ? app.interviewVideos[0].videoUrl : null,
      matchedSkills: app.matchedSkills || [],
      missingSkills: app.missingSkills || [],
      aiFeedback: app.aiFeedback || '',
      interviewVideos: app.interviewVideos || [],
      recruiterFeedback: app.recruiterFeedback || '',
      managerFeedback: app.managerFeedback || '',
    }));

    res.json(mapped.sort((a, b) => b.appliedAt - a.appliedAt));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Applicant - Save/unsave job
async function toggleSaveJob(req, res) {
  try {
    const applicant = await User.findById(req.applicant._id);
    const jobId = req.params.jobId;

    const isSaved = applicant.savedJobs.includes(jobId);

    if (isSaved) {
      applicant.savedJobs = applicant.savedJobs.filter((id) => id.toString() !== jobId);
    } else {
      applicant.savedJobs.push(jobId);
    }

    await applicant.save();

    res.json({
      message: isSaved ? 'Job removed from saved' : 'Job added to saved',
      saved: !isSaved,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Recruiter - View applicants for a job
async function viewApplicants(req, res) {
  try {
    const { jobId } = req.params;
    const { status, sortBy = 'matchScore' } = req.query;

    const filter = { jobId };
    if (status) {
      filter.$or = [
        { pipelineStatus: status },
        { status: status }
      ];
    }

    // Map query sort field from score to matchScore if necessary
    const sortField = sortBy === 'score' ? 'matchScore' : sortBy;

    const applications = await Application.find(filter)
      .populate('applicantId', 'name email phone location profile')
      .populate('userId', 'name email phone location profile')
      .sort({ [sortField]: -1 });

    const mapped = applications.map(mapApplicationForFrontend);

    res.json({ applications: mapped });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function notifyStatusChange(application) {
  try {
    const { sendEmail } = require('../utils/mailer');
    const email = application.extractedEmail || (application.applicantId && application.applicantId.email);
    if (!email) return;

    const name = application.extractedName || (application.applicantId && application.applicantId.name) || 'Applicant';
    const Job = require('../models/Job');
    const job = await Job.findById(application.jobId);
    const jobTitle = job ? job.title : 'Position';

    let subject = `Application Status Update - ${jobTitle}`;
    let text = `Hello ${name},\n\nYour application status for the position of ${jobTitle} has been updated to: ${application.pipelineStatus}.\n\nPlease log in to your candidate dashboard to check for any updates or video interview requests.\n\nBest regards,\nRecruitment Team`;
    let html = `<p>Hello <b>${name}</b>,</p><p>Your application status for the position of <b>${jobTitle}</b> has been updated to: <b>${application.pipelineStatus}</b>.</p><p>Please log in to your <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login">Candidate Dashboard</a> to check for any updates or video interview requests.</p><br><p>Best regards,<br>Recruitment Team</p>`;

    if (application.pipelineStatus === 'interview') {
      subject = `Video Interview Requested - ${jobTitle}`;
      text = `Hello ${name},\n\nCongratulations! You have been invited for a video interview for the position of ${jobTitle}.\n\nPlease log in to your candidate dashboard, navigate to the "AI Interviews" tab, and complete your video interview responses.\n\nBest regards,\nRecruitment Team`;
      html = `<p>Hello <b>${name}</b>,</p><p>Congratulations! You have been invited for a video interview for the position of <b>${jobTitle}</b>.</p><p>Please log in to your <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login">Candidate Dashboard</a>, navigate to the <b>AI Interviews</b> tab, and record your video interview responses.</p><br><p>Best regards,<br>Recruitment Team</p>`;
    } else if (application.pipelineStatus === 'rejected') {
      subject = `Update on your application for ${jobTitle}`;
      text = `Hello ${name},\n\nThank you for your interest in the ${jobTitle} role. After careful review, we regret to inform you that we will not be moving forward with your application at this time.\n\nWe appreciate your time and effort and wish you the best in your search.\n\nBest regards,\nRecruitment Team`;
      html = `<p>Hello <b>${name}</b>,</p><p>Thank you for your interest in the <b>${jobTitle}</b> role. After careful review, we regret to inform you that we will not be moving forward with your application at this time.</p><p>We appreciate your time and effort and wish you the best in your search.</p><br><p>Best regards,<br>Recruitment Team</p>`;
    }

    await sendEmail({ to: email, subject, text, html });
  } catch (err) {
    console.error('Failed to notify status change:', err.message);
  }
}

// Recruiter/Manager - Update applicant status
async function updateApplicationStatus(req, res) {
  try {
    const { applicationId } = req.params;
    const { status, feedback } = req.body;

    const validStatuses = [
      'applied',
      'screening',
      'shortlisted',
      'interview',
      'recruiter_review',
      'manager_review',
      'selected',
      'rejected',
      'onboarding',
    ];

    const targetStatus = status ? status.toLowerCase() : '';
    if (!validStatuses.includes(targetStatus)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Application.findById(applicationId).populate('applicantId');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.pipelineStatus = targetStatus;
    application.status = targetStatus;
    if (feedback !== undefined) {
      application.recruiterFeedback = feedback;
    }
    if (req.user.role === 'hr_recruiter') {
      application.recruiterReviewedAt = new Date();
    } else if (req.user.role === 'senior_manager') {
      application.managerReviewedAt = new Date();
    }

    await application.save();
    notifyStatusChange(application);

    res.json({
      message: 'Application status updated',
      application: mapApplicationForFrontend(application),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Recruiter - Shortlist applicant
async function shortlistApplicant(req, res) {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.applicationId,
      {
        pipelineStatus: 'shortlisted',
        status: 'shortlisted',
        recruiterReviewedAt: new Date(),
      },
      { new: true }
    ).populate('applicantId');

    if (application) {
      notifyStatusChange(application);
    }

    res.json({ message: 'Applicant shortlisted', application: mapApplicationForFrontend(application) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Recruiter - Reject applicant
async function rejectApplicant(req, res) {
  try {
    const { reason } = req.body;

    const application = await Application.findByIdAndUpdate(
      req.params.applicationId,
      {
        pipelineStatus: 'rejected',
        status: 'rejected',
        isRejected: true,
        rejectionReason: reason || '',
        recruiterReviewedAt: new Date(),
      },
      { new: true }
    ).populate('applicantId');

    if (application) {
      notifyStatusChange(application);
    }

    res.json({ message: 'Applicant rejected', application: mapApplicationForFrontend(application) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Admin - Convert applicant to employee
async function convertToEmployee(req, res) {
  try {
    const { applicationId, department, managerId, designation } = req.body;

    const application = await Application.findByIdAndUpdate(
      applicationId,
      { 
        pipelineStatus: 'onboarding', 
        status: 'onboarding',
        isSelected: true, 
        selectedDate: new Date() 
      },
      { new: true }
    ).populate('applicantId');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const applicant = application.applicantId;
    if (!applicant) {
      return res.status(404).json({ message: 'Applicant user record not found' });
    }

    // Generate employee ID
    const count = await User.countDocuments({ role: 'employee' });
    const employeeId = `EMP-${String(count + 1).padStart(5, '0')}`;

    // Create temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 'Emp@123';
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Convert applicant to employee in-place
    applicant.role = 'employee';
    applicant.employeeId = employeeId;
    applicant.passwordHash = passwordHash;
    applicant.department = department || '';
    applicant.designation = designation || '';
    applicant.managerId = managerId || null;
    applicant.accountStatus = 'active';
    applicant.joinDate = new Date();
    applicant.createdBy = req.user._id;

    // Update conversion status info
    applicant.conversionStatus = 'employee';
    applicant.convertedTo = applicant._id;
    applicant.convertedDate = new Date();

    if (!applicant.profile) applicant.profile = {};
    applicant.profile.onboardingComplete = true;

    await applicant.save();

    // Trigger transactional welcome email
    const { sendEmail } = require('../utils/mailer');
    await sendEmail({
      to: applicant.email,
      subject: 'Welcome to Kyro! Your Employee Account has been Created',
      text: `Hello ${applicant.name},\n\nCongratulations! You have been successfully converted to an employee.\n\nYour Employee ID: ${applicant.employeeId}\nDesignation: ${designation || ''}\nDepartment: ${department || ''}\n\nYour Temporary Password: ${tempPassword}\n\nPlease log in at ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login and update your password on your profile.\n\nBest regards,\nKyro Operations Team`,
      html: `<p>Hello <b>${applicant.name}</b>,</p><p>Congratulations! You have been successfully converted to an employee.</p><p><b>Employee ID:</b> ${applicant.employeeId}<br><b>Designation:</b> ${designation || ''}<br><b>Department:</b> ${department || ''}</p><p><b>Your Temporary Password:</b> <code>${tempPassword}</code></p><p>Please log in at <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login">Kyro Platform</a> and update your password on your profile.</p><br><p>Best regards,<br>Kyro Operations Team</p>`
    });

    res.json({
      message: 'Applicant converted to employee successfully',
      employee: {
        id: applicant._id,
        name: applicant.name,
        email: applicant.email,
        employeeId: applicant.employeeId,
        role: applicant.role,
        department: applicant.department,
        tempPassword, // In production, send via email
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  browseJobs,
  getJobDetails,
  applyJob,
  myApplications,
  toggleSaveJob,
  viewApplicants,
  updateApplicationStatus,
  shortlistApplicant,
  rejectApplicant,
  convertToEmployee,
};
