const express = require('express');
const { chat, jobRecommendations } = require('../controllers/aiController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/chat', auth, chat);
router.get('/job-recommendations', auth, jobRecommendations);

module.exports = router;
