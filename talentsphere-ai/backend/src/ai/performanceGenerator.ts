import { complete } from './provider';

export interface PerformanceAIResult {
  aiSummary: string;
  strengths: string[];
  improvements: string[];
  promotionRecommendation: string;
  trainingRecommendations: string[];
}

export async function generatePerformanceReview(data: {
  kpis: { name: string; target: number; achieved: number }[];
  attendanceScore: number;
  tasksCompleted: number;
  rating: number;
}): Promise<PerformanceAIResult> {
  const prompt = `Generate performance review JSON from: KPIs ${JSON.stringify(data.kpis)}, attendance ${data.attendanceScore}, tasks ${data.tasksCompleted}, rating ${data.rating}/5. Fields: aiSummary, strengths[], improvements[], promotionRecommendation, trainingRecommendations[]`;

  const raw = await complete({
    system: 'HR performance analyst. JSON only.',
    user: prompt,
    json: true,
  });

  if (raw) {
    try {
      return JSON.parse(raw.replace(/```json|```/g, '')) as PerformanceAIResult;
    } catch {
      /* fallback */
    }
  }

  const kpiPct =
    data.kpis.length > 0
      ? data.kpis.reduce((s, k) => s + (k.achieved / Math.max(k.target, 1)) * 100, 0) / data.kpis.length
      : 70;

  return {
    aiSummary: `Overall rating ${data.rating}/5 with ${Math.round(kpiPct)}% KPI achievement and attendance score ${data.attendanceScore}.`,
    strengths: ['Consistent delivery', 'Collaboration', 'Technical competency'],
    improvements: data.rating < 4 ? ['Time management', 'Cross-team communication'] : ['Mentorship opportunities'],
    promotionRecommendation:
      data.rating >= 4 && kpiPct >= 85 ? 'Eligible for promotion review next cycle' : 'Continue in current role with development plan',
    trainingRecommendations: ['Leadership fundamentals', 'Advanced technical certification'],
  };
}
