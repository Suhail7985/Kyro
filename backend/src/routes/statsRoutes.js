const express = require('express');
const { getStatistics } = require('../controllers/statsController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, authorize('admin', 'senior_manager', 'hr_recruiter', 'recruiter'), getStatistics);

module.exports = router;
