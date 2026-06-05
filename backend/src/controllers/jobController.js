const Job = require('../models/Job');
const { generateInterviewQuestions } = require('../services/aiInterview');

async function createJob(req, res) {
  try {
    const { title, description, requiredSkills, location, salary, department, employmentType, experienceRequired, workType, status } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    const job = await Job.create({
      title,
      description,
      requiredSkills: requiredSkills || [],
      location,
      salary,
      department,
      employmentType,
      experienceRequired,
      workType,
      status: status || 'open',
      createdBy: req.user._id,
    });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function listJobs(req, res) {
  try {
    const filter = {};
    if (req.query.createdBy === 'me' && ['hr_recruiter', 'admin'].includes(req.user.role)) {
      filter.createdBy = req.user._id;
    }
    if (req.query.status) filter.status = req.query.status;
    else if (['applicant', 'employee'].includes(req.user.role)) filter.status = 'open';

    const jobs = await Job.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getJob(req, res) {
  try {
    const job = await Job.findById(req.params.id).populate('createdBy', 'name email');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateJob(req, res) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    Object.assign(job, req.body);
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleteJob(req, res) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await job.deleteOne();
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function generateQuestions(req, res) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const questions = await generateInterviewQuestions(job);
    job.interviewQuestions = questions;
    await job.save();
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { createJob, listJobs, getJob, updateJob, deleteJob, generateQuestions };
