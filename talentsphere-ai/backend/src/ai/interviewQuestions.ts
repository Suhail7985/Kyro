import { complete } from './provider';

export interface GeneratedQuestions {
  technicalQuestions: string[];
  behavioralQuestions: string[];
  hrQuestions: string[];
  followUpQuestions: string[];
}

export async function generateInterviewQuestions(
  jobRole: string,
  requiredSkills: string[],
  experienceLevel: string
): Promise<GeneratedQuestions> {
  const prompt = `Generate interview questions for ${jobRole}, skills: ${requiredSkills.join(', ')}, level: ${experienceLevel}. JSON: {"technicalQuestions":[],"behavioralQuestions":[],"hrQuestions":[],"followUpQuestions":[]} with 5 each category.`;

  const raw = await complete({
    system: 'Expert interview designer. JSON only.',
    user: prompt,
    json: true,
  });

  if (raw) {
    try {
      return JSON.parse(raw.replace(/```json|```/g, '')) as GeneratedQuestions;
    } catch {
      /* fallback */
    }
  }

  return {
    technicalQuestions: requiredSkills.map((s) => `Describe your experience with ${s} in production.`),
    behavioralQuestions: [
      'Tell me about a conflict you resolved on a team.',
      'Describe a time you missed a deadline and how you handled it.',
      'Give an example of leadership without formal authority.',
      'How do you prioritize when everything is urgent?',
      'Describe feedback that changed how you work.',
    ],
    hrQuestions: [
      'Why are you interested in this role?',
      'What are your salary expectations?',
      'When can you start?',
      'What is your preferred work arrangement?',
      'Do you require visa sponsorship?',
    ],
    followUpQuestions: [
      'Can you walk through that architecture in more detail?',
      'What would you do differently next time?',
      'How did you measure success?',
      'Who else was involved and what was your role?',
      'What tools would you use for this problem today?',
    ],
  };
}
