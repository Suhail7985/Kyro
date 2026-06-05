const express = require('express');
const {
  registerApplicant,
  loginApplicant,
  verifyEmail,
  verifyMfa,
  getApplicantProfile,
  updateApplicantProfile,
} = require('../controllers/applicantAuthController');
const { toggleMfa, logout } = require('../controllers/authController');
const { applicantAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', registerApplicant);
router.post('/login', loginApplicant);
router.post('/verify-email', verifyEmail);
router.post('/verify-mfa', verifyMfa);

// Protected routes
router.get('/profile', applicantAuth, getApplicantProfile);
router.put('/profile', applicantAuth, updateApplicantProfile);
router.post('/toggle-mfa', applicantAuth, toggleMfa);
router.post('/logout', logout);

module.exports = router;
