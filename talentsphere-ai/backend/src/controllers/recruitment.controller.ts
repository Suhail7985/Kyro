import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middlewares/auth';
import { Job, Candidate, Application, Interview } from '../models';
import { parseResumeBuffer } from '../utils/parseResume';
import { analyzeResume } from '../ai/resumeAnalyzer';
import { generateInterviewQuestions } from '../ai/interviewQuestions';
import { uploadFile } from '../utils/cloudinary';

export async function createJob(req: AuthRequest, res: Response) {
  const job = await Job.create({ ...req.body, createdBy: req.user!._id });
  res.status(201).json({ success: true, data: job });
}

export async function listJobs(req: AuthRequest, res: Response) {
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  else if (req.user!.role === 'employee') filter.status = 'open';
  const jobs = await Job.find(filter).sort({ createdAt: -1 }).populate('departmentId', 'name');
  res.json({ success: true, data: jobs });
}

export async function uploadResume(req: AuthRequest, res: Response) {
  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, message: 'Resume file required' });
    return;
  }

  const job = await Job.findById(req.params.jobId);
  if (!job) {
    res.status(404).json({ success: false, message: 'Job not found' });
    return;
  }

  const text = await parseResumeBuffer(file.buffer, file.mimetype, file.originalname);
  const analysis = await analyzeResume(text, job.description, job.requiredSkills);

  const email = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0] || `${Date.now()}@applicant.local`;
  let candidate = await Candidate.findOne({ email });
  if (!candidate) {
    candidate = await Candidate.create({
      name: analysis.name,
      email,
      skills: analysis.skills,
      experienceYears: 0,
      education: analysis.education,
      certifications: analysis.certifications,
      projects: analysis.projects,
    });
  }

  const tempPath = path.join(process.cwd(), 'uploads', 'resumes', `${Date.now()}-${file.originalname}`);
  fs.mkdirSync(path.dirname(tempPath), { recursive: true });
  fs.writeFileSync(tempPath, file.buffer);
  const resumeUrl = await uploadFile(tempPath, 'resumes');

  const application = await Application.findOneAndUpdate(
    { jobId: job._id, candidateId: candidate._id },
    {
      userId: req.user!._id,
      resumeUrl,
      resumeText: text,
      analysis,
      aiScore: analysis.matchPercentage,
      status: 'screening',
    },
    { upsert: true, new: true }
  );

  await Job.findByIdAndUpdate(job._id, { $inc: { applicantCount: 1 } });
  await rerankJob(job._id.toString());

  res.status(201).json({ success: true, data: application });
}

export async function bulkUpload(req: AuthRequest, res: Response) {
  const files = req.files as Express.Multer.File[];
  const job = await Job.findById(req.params.jobId);
  if (!job || !files?.length) {
    res.status(400).json({ success: false, message: 'Job and files required' });
    return;
  }

  const results = [];
  for (const file of files) {
    req.file = file;
    const mockRes = {
      status: () => mockRes,
      json: (d: unknown) => d,
    };
    try {
      const text = await parseResumeBuffer(file.buffer, file.mimetype, file.originalname);
      const analysis = await analyzeResume(text, job.description, job.requiredSkills);
      const email =
        text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0] ||
        `${Date.now()}-${Math.random()}@bulk.local`;
      let candidate = await Candidate.findOne({ email });
      if (!candidate) {
        candidate = await Candidate.create({
          name: analysis.name,
          email,
          skills: analysis.skills,
          education: analysis.education,
          certifications: analysis.certifications,
          projects: analysis.projects,
        });
      }
      const app = await Application.findOneAndUpdate(
        { jobId: job._id, candidateId: candidate._id },
        { resumeText: text, analysis, aiScore: analysis.matchPercentage, status: 'screening' },
        { upsert: true, new: true }
      );
      results.push(app);
    } catch (e) {
      results.push({ error: (e as Error).message, file: file.originalname });
    }
  }

  await rerankJob(job._id.toString());
  res.json({ success: true, data: results, leaderboard: await getLeaderboard(job._id.toString()) });
}

async function rerankJob(jobId: string) {
  const apps = await Application.find({ jobId }).sort({ aiScore: -1 });
  for (let i = 0; i < apps.length; i++) {
    apps[i].rank = i + 1;
    await apps[i].save();
  }
}

async function getLeaderboard(jobId: string) {
  return Application.find({ jobId })
    .sort({ aiScore: -1 })
    .limit(20)
    .populate('candidateId', 'name email skills');
}

export async function leaderboard(req: AuthRequest, res: Response) {
  const data = await getLeaderboard(req.params.jobId);
  res.json({ success: true, data });
}

export async function listApplications(req: AuthRequest, res: Response) {
  const filter: Record<string, unknown> = {};
  if (req.query.jobId) filter.jobId = req.query.jobId;
  const apps = await Application.find(filter)
    .sort({ aiScore: -1 })
    .populate('candidateId')
    .populate('jobId', 'title');
  res.json({ success: true, data: apps });
}

export async function updateApplicationStatus(req: AuthRequest, res: Response) {
  const app = await Application.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json({ success: true, data: app });
}

export async function generateQuestions(req: AuthRequest, res: Response) {
  const job = await Job.findById(req.params.jobId);
  if (!job) {
    res.status(404).json({ success: false, message: 'Job not found' });
    return;
  }
  const questions = await generateInterviewQuestions(
    job.title,
    job.requiredSkills,
    job.experienceLevel
  );

  const interview = await Interview.create({
    applicationId: req.body.applicationId,
    jobId: job._id,
    candidateId: req.body.candidateId,
    ...questions,
    generatedBy: 'ai',
    status: 'scheduled',
    scheduledAt: req.body.scheduledAt,
  });

  res.status(201).json({ success: true, data: interview });
}

export async function uploadVideo(req: AuthRequest, res: Response) {
  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, message: 'Video required' });
    return;
  }
  const url = await uploadFile(file.path, 'videos');
  const app = await Application.findByIdAndUpdate(
    req.params.id,
    { videoUrl: url, status: 'interview' },
    { new: true }
  );
  res.json({ success: true, data: app });
}

export async function myApplications(req: AuthRequest, res: Response) {
  const apps = await Application.find({ userId: req.user!._id })
    .sort({ createdAt: -1 })
    .populate('jobId', 'title description location experienceLevel requiredSkills');
  res.json({ success: true, data: apps });
}

export async function myInterviews(req: AuthRequest, res: Response) {
  // First find the candidate associated with this user
  const candidate = await Candidate.findOne({ email: req.user!.email });
  if (!candidate) {
    res.json({ success: true, data: [] });
    return;
  }
  const interviews = await Interview.find({ candidateId: candidate._id })
    .sort({ scheduledAt: 1 })
    .populate('jobId', 'title');
  res.json({ success: true, data: interviews });
}
