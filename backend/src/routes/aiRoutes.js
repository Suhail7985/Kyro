const express = require('express');
const { chat, jobRecommendations } = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/chat', authenticate, chat);
router.get('/job-recommendations', authenticate, jobRecommendations);

module.exports = router;
