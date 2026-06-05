import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { PerformanceReview, Employee } from '../models';
import { generatePerformanceReview } from '../ai/performanceGenerator';

export async function createReview(req: AuthRequest, res: Response) {
  const emp = await Employee.findById(req.body.employeeId);
  if (!emp) {
    res.status(404).json({ success: false, message: 'Employee not found' });
    return;
  }

  const ai = await generatePerformanceReview({
    kpis: req.body.kpis || [],
    attendanceScore: req.body.attendanceScore || 80,
    tasksCompleted: req.body.tasksCompleted || 0,
    rating: req.body.rating,
  });

  const review = await PerformanceReview.create({
    employeeId: emp._id,
    userId: emp.userId,
    reviewerId: req.user!._id,
    period: req.body.period,
    kpis: req.body.kpis,
    attendanceScore: req.body.attendanceScore,
    tasksCompleted: req.body.tasksCompleted,
    rating: req.body.rating,
    aiSummary: ai.aiSummary,
    strengths: ai.strengths,
    improvements: ai.improvements,
    promotionRecommendation: ai.promotionRecommendation,
    trainingRecommendations: ai.trainingRecommendations,
    status: 'submitted',
  });

  res.status(201).json({ success: true, data: review });
}

export async function listReviews(req: AuthRequest, res: Response) {
  const userId = (req.query.userId as string) || req.user!._id;
  const reviews = await PerformanceReview.find({ userId })
    .populate('reviewerId', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
}
