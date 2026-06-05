import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { hrAssistantReply } from '../ai/hrAssistant';
import { Application } from '../models';
import crypto from 'crypto';

function newSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function chat(req: AuthRequest, res: Response) {
  const { message, sessionId: sid } = req.body;
  if (!message) {
    res.status(400).json({ success: false, message: 'Message required' });
    return;
  }
  const reply = await hrAssistantReply(
    req.user!._id,
    sid || newSessionId(),
    message,
    { role: req.user!.role, name: req.user!.name }
  );
  res.json({ success: true, data: { reply } });
}

export async function topCandidates(req: AuthRequest, res: Response) {
  const skill = (req.query.skill as string) || 'React';
  const apps = await Application.find()
    .sort({ aiScore: -1 })
    .limit(20)
    .populate('candidateId', 'name email skills')
    .populate('jobId', 'title requiredSkills');

  const filtered = apps.filter((a) => {
    const skills = [
      ...(a.analysis?.skills || []),
      ...((a.candidateId as { skills?: string[] })?.skills || []),
      ...((a.jobId as { requiredSkills?: string[] })?.requiredSkills || []),
    ];
    return skills.some((s) => s.toLowerCase().includes(skill.toLowerCase()));
  });

  res.json({
    success: true,
    data: filtered.map((a, i) => ({
      rank: i + 1,
      name: (a.candidateId as { name?: string })?.name,
      score: a.aiScore,
      job: (a.jobId as { title?: string })?.title,
      recommendation: a.analysis?.hiringRecommendation,
    })),
  });
}

export async function hiringSummary(req: AuthRequest, res: Response) {
  const jobId = req.query.jobId as string;
  const apps = await Application.find(jobId ? { jobId } : {})
    .sort({ aiScore: -1 })
    .populate('candidateId', 'name')
    .populate('jobId', 'title');

  const strong = apps.filter((a) => a.analysis?.hiringRecommendation === 'strong_hire').length;
  const hire = apps.filter((a) => a.analysis?.hiringRecommendation === 'hire').length;
  const avg = apps.length ? Math.round(apps.reduce((s, a) => s + a.aiScore, 0) / apps.length) : 0;

  res.json({
    success: true,
    data: {
      total: apps.length,
      strongHire: strong,
      hire,
      averageScore: avg,
      top3: apps.slice(0, 3).map((a) => ({
        name: (a.candidateId as { name?: string })?.name,
        score: a.aiScore,
        job: (a.jobId as { title?: string })?.title,
      })),
    },
  });
}
