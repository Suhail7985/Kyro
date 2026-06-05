const express = require('express');
const { register, login, getMe, verifyMfa, toggleMfa, logout } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-mfa', verifyMfa);
router.post('/toggle-mfa', auth, toggleMfa);
router.post('/logout', logout);
router.get('/me', auth, getMe);

module.exports = router;
