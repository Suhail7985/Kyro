const Application = require('../models/Application');
const User = require('../models/User');
const Job = require('../models/Job');
const { scoreResume } = require('./aiScoring');

/**
 * AI Feature: Match employees to open roles based on skills + resume text.
 */
async function recommendJobsForUser(userId) {
  const user = await User.findById(userId);
  if (!user) return [];

  const jobs = await Job.find({ status: 'open' });
  const profileText = [
    user.name,
    (user.profile?.skills || []).join(' '),
    user.profile?.experience || '',
    user.profile?.education || '',
    user.designation || '',
  ].join(' ');

  let resumeText = profileText;
  const latestApp = await Application.findOne({ userId })
    .sort({ updatedAt: -1 })
    .select('resumeText');
  if (latestApp?.resumeText) resumeText = latestApp.resumeText;

  const recommendations = [];
  for (const job of jobs) {
    const scoring = await scoreResume(resumeText, job);
    recommendations.push({
      jobId: job._id,
      title: job.title,
      department: job.location,
      matchScore: scoring.score,
      matchedSkills: scoring.matchedSkills,
      missingSkills: scoring.missingSkills,
      feedback: scoring.feedback,
    });
  }

  return recommendations.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
}

module.exports = { recommendJobsForUser };
