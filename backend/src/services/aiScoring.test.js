const { keywordScore, scoreResume } = require('./aiScoring');

describe('aiScoring service', () => {
  it('returns 50 score when no required skills are provided', () => {
    const result = keywordScore('Any resume text', []);
    expect(result).toEqual({ score: 50, matchedSkills: [], missingSkills: [] });
  });

  it('matches skills in resume text and reports missing skills', () => {
    const resume = 'Experienced React developer with Node.js and MongoDB skills.';
    const required = ['React', 'Node.js', 'GraphQL'];

    const result = keywordScore(resume, required);
    expect(result.score).toBe(67);
    expect(result.matchedSkills).toEqual(['React', 'Node.js']);
    expect(result.missingSkills).toEqual(['GraphQL']);
  });

  it('falls back to keyword scoring when AI provider is unavailable', async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    process.env.AI_PROVIDER = 'openai';

    const resume = 'Python developer with SQL and AWS experience.';
    const job = { title: 'Backend Engineer', description: 'Work with SQL and AWS.', requiredSkills: ['Python', 'AWS', 'Docker'] };

    const result = await scoreResume(resume, job);
    expect(result).toEqual({
      score: 67,
      matchedSkills: ['Python', 'AWS'],
      missingSkills: ['Docker'],
      feedback: 'Scored using keyword matching (AI unavailable).',
    });
  });
});
