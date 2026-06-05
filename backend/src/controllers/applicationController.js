const path = require('path');
const fs = require('fs');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { parseResumeBuffer } = require('../utils/parseResume');
const { extractName, extractEmail } = require('../utils/extractResume');
const { scoreResume } = require('../services/aiScoring');
const { resumeDir } = require('../middleware/upload');

async function uploadResume(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Resume file is required' });

    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const text = await parseResumeBuffer(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    const filename = `${Date.now()}-${req.file.originalname}`;
    const filepath = path.join(resumeDir, filename);
    fs.writeFileSync(filepath, req.file.buffer);

    let application = await Application.findOne({
      userId: req.user._id,
      jobId: job._id,
    });

    const scoring = await scoreResume(text, job);

    const data = {
      resumeUrl: `/uploads/resumes/${filename}`,
      resumeText: text,
      extractedName: extractName(text) || req.user.name,
      extractedEmail: extractEmail(text) || req.user.email,
      score: scoring.score,
      matchedSkills: scoring.matchedSkills,
      missingSkills: scoring.missingSkills,
      aiFeedback: scoring.feedback,
      status: 'Screening',
    };

    if (application) {
      Object.assign(application, data);
      await application.save();
    } else {
      application = await Application.create({
        userId: req.user._id,
        jobId: job._id,
        ...data,
      });
    }

    const populated = await Application.findById(application._id)
      .populate('jobId', 'title requiredSkills')
      .populate('userId', 'name email');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function listApplications(req, res) {
  try {
    const filter = {};
    if (req.query.job) filter.jobId = req.query.job;
    if (req.user.role === 'candidate') filter.userId = req.user._id;

    const applications = await Application.find(filter)
      .populate('userId', 'name email profile')
      .populate('jobId', 'title requiredSkills createdBy')
      .sort({ score: -1, createdAt: -1 });

    if (req.user.role === 'recruiter' && req.query.job) {
      const job = await Job.findById(req.query.job);
      if (job && job.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized for this job' });
      }
    }

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getApplication(req, res) {
  try {
    const app = await Application.findById(req.params.id)
      .populate('userId', 'name email profile')
      .populate('jobId', 'title description requiredSkills');
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const isOwner = app.userId._id.toString() === req.user._id.toString();
    const isRecruiter = ['recruiter', 'admin'].includes(req.user.role);
    if (!isOwner && !isRecruiter) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const valid = ['Applied', 'Screening', 'Shortlisted', 'Rejected', 'Interview'];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const job = await Job.findById(app.jobId);
    if (
      req.user.role === 'recruiter' &&
      job?.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    app.status = status;
    await app.save();
    res.json(app);
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
