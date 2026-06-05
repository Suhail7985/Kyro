const express = require('express');
const {
  createJob,
  listJobs,
  getJob,
  updateJob,
  deleteJob,
  generateQuestions,
} = require('../controllers/jobController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, listJobs);
router.get('/:id', auth, getJob);
router.post('/', auth, authorize('hr_recruiter', 'recruiter', 'admin'), createJob);
router.put('/:id', auth, authorize('hr_recruiter', 'recruiter', 'admin'), updateJob);
router.delete('/:id', auth, authorize('hr_recruiter', 'recruiter', 'admin'), deleteJob);
router.post('/:id/questions', auth, authorize('hr_recruiter', 'recruiter', 'admin'), generateQuestions);

module.exports = router;
