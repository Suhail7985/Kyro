const express = require('express');
const {
  uploadResume,
  listApplications,
  getApplication,
  updateStatus,
  uploadVideo,
  bulkScore,
} = require('../controllers/applicationController');
const { auth, authorize } = require('../middleware/auth');
const { resumeUpload, videoUpload } = require('../middleware/upload');

const router = express.Router();

router.get('/', auth, listApplications);
router.post('/bulk-score', auth, authorize('recruiter', 'admin'), bulkScore);
router.post(
  '/:jobId/upload',
  auth,
  authorize('employee', 'candidate'),
  resumeUpload.single('resume'),
  uploadResume
);
router.put(
  '/:id/status',
  auth,
  authorize('recruiter', 'admin'),
  updateStatus
);
router.post(
  '/:id/video',
  auth,
  authorize('employee', 'candidate'),
  videoUpload.single('video'),
  uploadVideo
);
router.get('/:id', auth, getApplication);

module.exports = router;
