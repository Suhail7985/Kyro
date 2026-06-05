import { complete } from './provider';
import { IResumeAnalysis } from '../models/Application';

export async function analyzeResume(
  resumeText: string,
  jobDescription: string,
  requiredSkills: string[]
): Promise<IResumeAnalysis> {
  const prompt = `Analyze resume against job. Resume:\n${resumeText.slice(0, 12000)}\n\nJob:\n${jobDescription}\nSkills: ${requiredSkills.join(', ')}\n\nReturn JSON: {"name":"","skills":[],"experience":"","education":"","certifications":[],"projects":[],"matchPercentage":0,"missingSkills":[],"strengths":[],"weaknesses":[],"hiringRecommendation":"strong_hire|hire|maybe|no_hire","aiFeedback":""}`;

  const raw = await complete({
    system: 'You are an expert technical recruiter AI. Output valid JSON only.',
    user: prompt,
    json: true,
  });

  if (raw) {
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '')) as IResumeAnalysis;
      parsed.matchPercentage = Math.min(100, Math.max(0, Number(parsed.matchPercentage) || 0));
      return parsed;
    } catch {
      /* fallback */
    }
  }

  return fallbackAnalysis(resumeText, requiredSkills);
}

function fallbackAnalysis(text: string, skills: string[]): IResumeAnalysis {
  const lower = text.toLowerCase();
  const matched = skills.filter((s) => lower.includes(s.toLowerCase()));
  const missing = skills.filter((s) => !lower.includes(s.toLowerCase()));
  const pct = skills.length ? Math.round((matched.length / skills.length) * 100) : 50;
  const emailMatch = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  const nameMatch = text.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m);

  return {
    name: nameMatch?.[1] || 'Unknown',
    skills: matched,
    experience: text.slice(0, 500),
    education: '',
    certifications: [],
    projects: [],
    matchPercentage: pct,
    missingSkills: missing,
    strengths: matched.slice(0, 5),
    weaknesses: missing.slice(0, 5),
    hiringRecommendation: pct >= 75 ? 'strong_hire' : pct >= 55 ? 'hire' : pct >= 35 ? 'maybe' : 'no_hire',
    aiFeedback: `Keyword match ${pct}%. Matched ${matched.length}/${skills.length} required skills.`,
  };
}
