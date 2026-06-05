const express = require('express');
const {
  generateInterviewQuestions,
  uploadInterviewVideo,
  getInterviewVideos,
  viewApplicantVideos,
  rerecordVideo,
} = require('../controllers/videoInterviewController');
const { auth, authorize, applicantAuth } = require('../middleware/auth');
const { videoUpload } = require('../middleware/upload');

const router = express.Router();

// Recruiter - Generate questions
router.post('/questions/:jobId', auth, authorize(['hr_recruiter']), generateInterviewQuestions);

// Applicant - Upload video
router.post('/upload/:applicationId', applicantAuth, videoUpload.single('video'), uploadInterviewVideo);

// Applicant - Get my videos
router.get('/my-videos/:applicationId', applicantAuth, getInterviewVideos);

// Applicant - Re-record video
router.put('/rerecord/:applicationId/:videoId', applicantAuth, videoUpload.single('video'), rerecordVideo);

// Recruiter/Manager - View videos
router.get('/view/:applicationId', auth, authorize(['hr_recruiter', 'senior_manager']), viewApplicantVideos);

module.exports = router;
