const OpenAI = require('openai');

async function generateQuestionsWithOpenAI(job) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const openai = new OpenAI({ apiKey });
  const prompt = `You are an expert hiring manager. Create 5 concise behavioral and technical interview questions for the following job opening. Respond only with a JSON array of questions.

Job title: ${job.title}
Required skills: ${(job.requiredSkills || []).join(', ')}
Job description: ${job.description}

Return:
["question 1", "question 2", ...]`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      response_format: { type: 'json_array' },
    });

    const questions = completion.choices?.[0]?.message?.content;
    if (Array.isArray(questions)) return questions;
    return null;
  } catch (err) {
    console.error('OpenAI interview question error:', err.message);
    return null;
  }
}

function fallbackQuestions(job) {
  const skills = (job.requiredSkills || []).slice(0, 5);
  const base = `${job.title}. ${job.description}`;
  const questions = [
    `Can you describe how your experience matches the main goals of this role?`,
    `Tell me about a time you used ${skills[0] || 'a key skill'} to solve a problem at work.`,
    `Which tools or processes do you rely on for ${skills[1] || 'this type of work'}?`,
    `How do you prioritize tasks when working on ${skills[2] || 'multiple projects'}?`,
    `What would you focus on during your first 30 days in this ${job.title} role?`,
  ];
  return questions;
}

async function generateInterviewQuestions(job) {
  const aiResult = await generateQuestionsWithOpenAI(job);
  if (aiResult && aiResult.length) return aiResult;
  return fallbackQuestions(job);
}

module.exports = { generateInterviewQuestions };
