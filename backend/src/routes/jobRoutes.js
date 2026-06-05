const express = require('express');
const {
  createJob,
  listJobs,
  getJob,
  updateJob,
  deleteJob,
  generateQuestions,
} = require('../controllers/jobController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, listJobs);
router.get('/:id', authenticate, getJob);
router.post('/', authenticate, authorize('hr_recruiter', 'recruiter', 'admin'), createJob);
router.put('/:id', authenticate, authorize('hr_recruiter', 'recruiter', 'admin'), updateJob);
router.delete('/:id', authenticate, authorize('hr_recruiter', 'recruiter', 'admin'), deleteJob);
router.post('/:id/questions', authenticate, authorize('hr_recruiter', 'recruiter', 'admin'), generateQuestions);

module.exports = router;
