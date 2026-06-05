const { hrChatReply } = require('../services/aiHrAssistant');
const { recommendJobsForUser } = require('../services/aiJobMatching');

async function chat(req, res) {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message required' });
    const result = await hrChatReply(message, { role: req.user.role, name: req.user.name });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function jobRecommendations(req, res) {
  try {
    const userId = req.query.userId || req.user._id;
    const recs = await recommendJobsForUser(userId);
    res.json(recs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { chat, jobRecommendations };
