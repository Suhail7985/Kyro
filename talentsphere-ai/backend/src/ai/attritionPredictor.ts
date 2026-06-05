export interface AttritionResult {
  risk: 'low' | 'medium' | 'high';
  score: number;
  factors: string[];
  explanation: string;
}

/**
 * Explainable attrition scoring (no black box) — weighted factors.
 */
export function predictAttrition(input: {
  lateDays: number;
  absentDays: number;
  avgPerformance: number;
  leaveUsagePct: number;
  tenureMonths: number;
}): AttritionResult {
  let score = 0;
  const factors: string[] = [];

  if (input.lateDays >= 5) {
    score += 25;
    factors.push(`High late arrivals (${input.lateDays} days)`);
  } else if (input.lateDays >= 2) {
    score += 10;
    factors.push(`Moderate late arrivals (${input.lateDays} days)`);
  }

  if (input.absentDays >= 4) {
    score += 30;
    factors.push(`Elevated absences (${input.absentDays} days)`);
  } else if (input.absentDays >= 2) {
    score += 15;
    factors.push(`Some absences (${input.absentDays} days)`);
  }

  if (input.avgPerformance < 2.5) {
    score += 25;
    factors.push(`Low performance rating (${input.avgPerformance.toFixed(1)}/5)`);
  } else if (input.avgPerformance < 3.5) {
    score += 10;
    factors.push(`Below-average performance (${input.avgPerformance.toFixed(1)}/5)`);
  }

  if (input.leaveUsagePct > 0.9) {
    score += 15;
    factors.push('Leave balance nearly exhausted');
  }

  if (input.tenureMonths < 6) {
    score += 10;
    factors.push('Early tenure (< 6 months) — higher flight risk window');
  } else if (input.tenureMonths > 48 && input.avgPerformance < 3.5) {
    score += 10;
    factors.push('Long tenure with stagnant performance');
  }

  score = Math.min(100, score);
  const risk: AttritionResult['risk'] = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';

  return {
    risk,
    score,
    factors,
    explanation: `Weighted score ${score}/100 from attendance, performance, leave, and tenure signals.`,
  };
}
