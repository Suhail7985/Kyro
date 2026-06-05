const express = require('express');
const { getStatistics } = require('../controllers/statsController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, authorize('admin', 'senior_manager', 'hr_recruiter', 'recruiter'), getStatistics);

module.exports = router;
