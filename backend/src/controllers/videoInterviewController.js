const Application = require('../models/Application');
const Job = require('../models/Job');
const fs = require('fs');
const path = require('path');

const videosDir = path.join(__dirname, '../../uploads/videos');

// Recruiter - Generate interview questions based on job
async function generateInterviewQuestions(req, res) {
  try {
    const { jobId } = req.params;
    const { skills = [], requirements = [] } = req.body;

    // AI-based question generation (placeholder)
    const questions = generateQuestionsFromSkills(skills, requirements);

    res.json({
      questions,
      message: 'Interview questions generated successfully',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

function generateQuestionsFromSkills(skills, requirements) {
  const baseQuestions = [
    'Tell us about your most challenging project and how you overcame it.',
    'What is your approach to problem-solving in complex scenarios?',
    'Describe a time when you had to learn a new technology quickly.',
    'How do you prioritize tasks when working on multiple projects?',
    'Tell us about your experience working in teams.',
  ];

  const skillQuestions = {
    react: 'Explain the component lifecycle in React and how you use hooks.',
    javascript: 'What are closures in JavaScript and how do you use them?',
    python: 'Explain list comprehension and generator functions in Python.',
    sql: 'Write a query to find the second highest salary in a employees table.',
    'node.js': 'Explain event-driven architecture in Node.js.',
    data_analysis: 'Walk us through your approach to analyzing a new dataset.',
    excel: 'Describe your experience with pivot tables and VLOOKUP.',
    leadership: 'Tell us about a time you led a team or project.',
    management: 'How do you handle conflicts within your team?',
  };

  const questions = [...baseQuestions];

  skills.forEach((skill) => {
    const skillLower = skill.toLowerCase().replace(/\s+/g, '_');
    if (skillQuestions[skillLower]) {
      questions.push(skillQuestions[skillLower]);
    }
  });

  return questions.slice(0, 5);
}

// Applicant - Upload interview video response
async function uploadInterviewVideo(req, res) {
  try {
    const applicationId = req.params.applicationId || req.body.applicationId;
    const { questionId, question, videoUrl, transcript } = req.body;

    if (!req.file && !videoUrl) {
      return res.status(400).json({ message: 'Video file or videoUrl is required' });
    }

    const application = await Application.findById(applicationId)
      .populate('applicantId');

    if (!application) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify applicant owns this application
    if (application.applicantId._id.toString() !== req.applicant._id.toString()) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ message: 'Unauthorized' });
    }

    let finalVideoUrl = videoUrl;

    if (!finalVideoUrl) {
      const { isCloudinaryConfigured, uploadLocalFile } = require('../utils/cloudinary');
      if (isCloudinaryConfigured()) {
        try {
          const uploadResult = await uploadLocalFile(req.file.path, 'videos', 'video');
          finalVideoUrl = uploadResult.secure_url;
        } finally {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        }
      } else {
        finalVideoUrl = `/uploads/videos/${req.file.filename}`;
      }
    } else {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }

    // Calculate video duration (placeholder - would need ffprobe in production)
    const videoDuration = Math.floor(Math.random() * 300) + 60; // 1-5 minutes

    // Run AI video analysis
    const { analyzeVideoResponse } = require('../services/aiVideoAnalysis');
    const job = await Job.findById(application.jobId);
    const analysis = await analyzeVideoResponse(finalVideoUrl, question || 'Interview Question', job?.requiredSkills || [], transcript);

    // Add video to application
    const videoEntry = {
      questionId: questionId || `q_${Date.now()}`,
      question: question || 'Interview Question',
      videoUrl: finalVideoUrl,
      videoDuration,
      uploadedAt: new Date(),
      videoAnalysis: analysis,
    };

    application.interviewVideos.push(videoEntry);

    // Automatically advance candidate status on upload
    const totalQuestions = job?.interviewQuestions?.length || 3;

    if (application.interviewVideos.length >= totalQuestions) {
      application.pipelineStatus = 'recruiter_review';
      application.status = 'recruiter_review';

      // Notify recruiter that the applicant finished the interview
      try {
        const { sendEmail } = require('../utils/mailer');
        const User = require('../models/User');
        const recruiterUser = await User.findById(job.createdBy);
        if (recruiterUser) {
          // Fire and forget the email so it doesn't block the video upload response
          sendEmail({
            to: recruiterUser.email,
            subject: `Video Interview Complete - ${application.extractedName || 'Applicant'}`,
            text: `Hello ${recruiterUser.name},\n\nCandidate ${application.extractedName || 'Applicant'} has completed all video responses for the job: "${job.title}".\n\nPlease log in to the Recruiter Dashboard to review their transcripts, confidence scores, and play their video responses.\n\nBest regards,\nKyro HR Platform`,
            html: `<p>Hello <b>${recruiterUser.name}</b>,</p><p>Candidate <b>${application.extractedName || 'Applicant'}</b> has completed all video responses for the job: "<b>${job.title}</b>".</p><p>Please log in to the <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login">Recruiter Dashboard</a> to review their transcripts, confidence scores, and play their video responses.</p><br><p>Best regards,<br>Kyro HR Platform</p>`
          }).catch(err => console.error('Failed to notify recruiter in background:', err.message));
        }
      } catch (mailErr) {
        console.error('Failed to notify recruiter of finished video interview:', mailErr.message);
      }
    } else {
      application.pipelineStatus = 'interview';
      application.status = 'interview';
    }

    await application.save();

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: videoEntry,
      totalVideos: application.interviewVideos.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Applicant - Get interview videos for application
async function getInterviewVideos(req, res) {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate('applicantId');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify applicant owns this application
    if (application.applicantId._id.toString() !== req.applicant._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json({
      videos: application.interviewVideos,
      totalVideos: application.interviewVideos.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Recruiter/Manager - View interview videos
async function viewApplicantVideos(req, res) {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate('applicantId', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({
      applicantName: application.applicantId.name,
      videos: application.interviewVideos,
      totalVideos: application.interviewVideos.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Applicant - Re-record video
async function rerecordVideo(req, res) {
  try {
    const { applicationId, videoId } = req.params;
    const { videoUrl } = req.body;

    if (!req.file && !videoUrl) {
      return res.status(400).json({ message: 'Video file or videoUrl is required' });
    }

    const application = await Application.findById(applicationId)
      .populate('applicantId');

    if (!application) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify applicant owns this application
    if (application.applicantId._id.toString() !== req.applicant._id.toString()) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Find and replace video
    const videoIndex = application.interviewVideos.findIndex(
      (v) => v._id.toString() === videoId
    );

    if (videoIndex < 0) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'Video not found' });
    }

    // Delete old file if it was a local file
    const oldUrl = application.interviewVideos[videoIndex].videoUrl;
    if (oldUrl.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '../../uploads', oldUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    let finalVideoUrl = videoUrl;

    if (!finalVideoUrl) {
      const { isCloudinaryConfigured, uploadLocalFile } = require('../utils/cloudinary');
      if (isCloudinaryConfigured()) {
        try {
          const uploadResult = await uploadLocalFile(req.file.path, 'videos', 'video');
          finalVideoUrl = uploadResult.secure_url;
        } finally {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        }
      } else {
        finalVideoUrl = `/uploads/videos/${req.file.filename}`;
      }
    } else {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }

    // Run AI video analysis
    const { analyzeVideoResponse } = require('../services/aiVideoAnalysis');
    const job = await Job.findById(application.jobId);
    const questionText = application.interviewVideos[videoIndex].question || 'Interview Question';
    const analysis = await analyzeVideoResponse(finalVideoUrl, questionText, job?.requiredSkills || []);

    // Update video entry
    const videoDuration = Math.floor(Math.random() * 300) + 60;
    const existingVideo = application.interviewVideos[videoIndex].toObject();
    application.interviewVideos[videoIndex] = {
      ...existingVideo,
      videoUrl: finalVideoUrl,
      videoDuration,
      uploadedAt: new Date(),
      videoAnalysis: analysis,
    };

    await application.save();

    res.json({
      message: 'Video re-recorded successfully',
      video: application.interviewVideos[videoIndex],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  generateInterviewQuestions,
  uploadInterviewVideo,
  getInterviewVideos,
  viewApplicantVideos,
  rerecordVideo,
};
