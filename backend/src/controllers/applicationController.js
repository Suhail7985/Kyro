const path = require('path');
const fs = require('fs');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
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
    applicantId: appObj.applicantId || appObj.userId,
    score: appObj.matchScore !== undefined ? appObj.matchScore : appObj.score,
    status: appObj.pipelineStatus || appObj.status,
  };
}

async function uploadResume(req, res) {
  try {
    const { resumeUrl } = req.body;
    if (!req.file && !resumeUrl) return res.status(400).json({ message: 'Resume file or resumeUrl is required' });

    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    let finalResumeUrl = resumeUrl;
    let text = '';

    if (resumeUrl) {
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
      text = await parseResumeBuffer(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );

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
    const candidateUser = await User.findById(req.user._id);
    if (candidateUser) {
      if (!candidateUser.profile) candidateUser.profile = {};
      if (parsedResume.phone && !candidateUser.profile.phone) candidateUser.profile.phone = parsedResume.phone;
      if (parsedResume.location && !candidateUser.profile.location) candidateUser.profile.location = parsedResume.location;
      if (parsedResume.skills?.length) {
        candidateUser.profile.skills = Array.from(new Set([...(candidateUser.profile.skills || []), ...parsedResume.skills]));
      }
      if (parsedResume.experienceSummary && !candidateUser.profile.experience) candidateUser.profile.experience = parsedResume.experienceSummary;
      if (parsedResume.educationSummary && !candidateUser.profile.education) candidateUser.profile.education = parsedResume.educationSummary;
      
      candidateUser.markModified('profile');
      await candidateUser.save();
    }

    let application = await Application.findOne({
      $or: [{ userId: req.user._id }, { applicantId: req.user._id }],
      jobId: job._id,
    });

    const scoring = await scoreResume(text, job);

    const data = {
      resumeUrl: finalResumeUrl,
      resumeText: text,
      extractedName: parsedResume.name || req.user.name,
      extractedEmail: parsedResume.email || req.user.email,
      score: scoring.score,
      matchScore: scoring.score,
      matchedSkills: scoring.matchedSkills,
      missingSkills: scoring.missingSkills,
      aiFeedback: scoring.feedback,
      status: 'screening',
      pipelineStatus: 'screening',
    };

    if (application) {
      Object.assign(application, data);
      await application.save();
    } else {
      application = await Application.create({
        userId: req.user._id,
        applicantId: req.user._id,
        jobId: job._id,
        ...data,
      });
    }

    const populated = await Application.findById(application._id)
      .populate('jobId', 'title requiredSkills')
      .populate('userId', 'name email')
      .populate('applicantId', 'name email');

    res.status(201).json(mapApplicationForFrontend(populated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function listApplications(req, res) {
  try {
    const filter = {};
    if (req.query.job) filter.jobId = req.query.job;
    if (req.user.role === 'candidate' || req.user.role === 'applicant') {
      filter.$or = [{ userId: req.user._id }, { applicantId: req.user._id }];
    }

    const applications = await Application.find(filter)
      .populate('userId', 'name email profile')
      .populate('applicantId', 'name email phone location profile')
      .populate('jobId', 'title requiredSkills createdBy')
      .sort({ matchScore: -1, score: -1, createdAt: -1 });

    if (['recruiter', 'hr_recruiter'].includes(req.user.role) && req.query.job) {
      const job = await Job.findById(req.query.job);
      if (job && job.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized for this job' });
      }
    }

    const mapped = applications.map(mapApplicationForFrontend);
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getApplication(req, res) {
  try {
    const app = await Application.findById(req.params.id)
      .populate('userId', 'name email profile')
      .populate('applicantId', 'name email phone location profile')
      .populate('jobId', 'title description requiredSkills');
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const isOwner = (app.userId && app.userId._id.toString() === req.user._id.toString()) || 
                    (app.applicantId && app.applicantId._id.toString() === req.user._id.toString());
    const isRecruiter = ['recruiter', 'hr_recruiter', 'admin', 'senior_manager'].includes(req.user.role);
    if (!isOwner && !isRecruiter) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(mapApplicationForFrontend(app));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const valid = ['applied', 'screening', 'shortlisted', 'rejected', 'interview', 'recruiter_review', 'manager_review', 'selected', 'onboarding'];
    const targetStatus = status ? status.toLowerCase() : '';
    if (!valid.includes(targetStatus)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const job = await Job.findById(app.jobId);
    if (
      ['recruiter', 'hr_recruiter'].includes(req.user.role) &&
      job?.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    app.status = targetStatus;
    app.pipelineStatus = targetStatus;
    await app.save();
    res.json(mapApplicationForFrontend(app));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function uploadVideo(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Video file is required' });

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (app.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the applicant can upload video' });
    }

    app.videoUrl = `/uploads/videos/${req.file.filename}`;
    app.videoFilename = req.file.filename;
    app.status = 'Interview';
    await app.save();

    res.json({ message: 'Video uploaded', videoUrl: app.videoUrl, application: app });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function bulkScore(req, res) {
  try {
    const { jobId } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const applications = await Application.find({ jobId, resumeText: { $exists: true, $ne: '' } });
    const results = [];

    for (const app of applications) {
      const scoring = await scoreResume(app.resumeText, job);
      app.score = scoring.score;
      app.matchedSkills = scoring.matchedSkills;
      app.missingSkills = scoring.missingSkills;
      app.aiFeedback = scoring.feedback;
      await app.save();
      results.push({ id: app._id, score: app.score });
    }

    res.json({ message: `Rescored ${results.length} applications`, results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  uploadResume,
  listApplications,
  getApplication,
  updateStatus,
  uploadVideo,
  bulkScore,
};
