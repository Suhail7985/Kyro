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
    if (typeof questions === 'string') return JSON.parse(questions);
    return null;
  } catch (err) {
    console.error('OpenAI interview question error:', err.message);
    return null;
  }
}

async function generateQuestionsWithGemini(job) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are an expert hiring manager. Create 5 concise behavioral and technical interview questions for the following job opening. Respond only with a JSON array of strings. Do not include any markdown or text formatting, ONLY the JSON array.

Job title: ${job.title}
Required skills: ${(job.requiredSkills || []).join(', ')}
Job description: ${job.description}

Example response:
["question 1", "question 2"]`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Gemini API Error: ${data.error?.message || res.statusText}`);
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    
    // Clean markdown if it leaked through
    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (err) {
    console.error('Gemini interview question error:', err.message);
    return null;
  }
}

function fallbackQuestions(job) {
  const skills = (job.requiredSkills || []).slice(0, 5);
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
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  let aiResult = null;

  if (provider === 'gemini') {
    aiResult = await generateQuestionsWithGemini(job);
  } else {
    aiResult = await generateQuestionsWithOpenAI(job);
  }

  if (aiResult && Array.isArray(aiResult) && aiResult.length > 0) {
    return aiResult;
  }

  return fallbackQuestions(job);
}

module.exports = { generateInterviewQuestions };
