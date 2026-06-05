const express = require('express');
const {
  uploadResume,
  listApplications,
  getApplication,
  updateStatus,
  uploadVideo,
  bulkScore,
} = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middleware/auth');
const { resumeUpload, videoUpload } = require('../middleware/upload');

const router = express.Router();

router.get('/', authenticate, listApplications);
router.post('/bulk-score', authenticate, authorize('recruiter', 'admin'), bulkScore);
router.post(
  '/:jobId/upload',
  authenticate,
  authorize('employee', 'candidate'),
  resumeUpload.single('resume'),
  uploadResume
);
router.put(
  '/:id/status',
  authenticate,
  authorize('recruiter', 'admin'),
  updateStatus
);
router.post(
  '/:id/video',
  authenticate,
  authorize('employee', 'candidate'),
  videoUpload.single('video'),
  uploadVideo
);
router.get('/:id', authenticate, getApplication);

module.exports = router;
