const express = require('express');
const {
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
} = require('../controllers/recruitmentController');
const { auth, authorize, applicantAuth } = require('../middleware/auth');
const { resumeUpload } = require('../middleware/upload');

const router = express.Router();

// Public routes - job browsing
router.get('/jobs', browseJobs);
router.get('/jobs/:jobId', getJobDetails);

// Applicant routes - job application
router.post('/apply/:jobId', applicantAuth, resumeUpload.single('resume'), applyJob);
router.get('/my-applications', applicantAuth, myApplications);
router.post('/save-job/:jobId', applicantAuth, toggleSaveJob);

// Recruiter routes - manage applicants
router.get('/applicants/:jobId', auth, authorize(['hr_recruiter']), viewApplicants);
router.put('/applications/:applicationId/status', auth, authorize(['hr_recruiter', 'senior_manager']), updateApplicationStatus);
router.post('/applications/:applicationId/shortlist', auth, authorize(['hr_recruiter']), shortlistApplicant);
router.post('/applications/:applicationId/reject', auth, authorize(['hr_recruiter']), rejectApplicant);

// Admin routes - convert to employee
router.post('/applications/:applicationId/convert-to-employee', auth, authorize(['admin']), convertToEmployee);

module.exports = router;
