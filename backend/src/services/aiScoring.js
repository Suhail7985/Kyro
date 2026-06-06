const OpenAI = require('openai');

function keywordScore(resumeText, requiredSkills) {
  if (!requiredSkills?.length) return { score: 50, matchedSkills: [], missingSkills: [] };
  const lower = resumeText.toLowerCase();
  const matched = [];
  const missing = [];
  for (const skill of requiredSkills) {
    if (lower.includes(skill.toLowerCase())) matched.push(skill);
    else missing.push(skill);
  }
  const score = Math.round((matched.length / requiredSkills.length) * 100);
  return { score, matchedSkills: matched, missingSkills: missing };
}

async function scoreWithOpenAI(resumeText, job) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const openai = new OpenAI({ apiKey });
  const prompt = `You are an HR AI assistant. Score this resume against the job requirements.

Job Title: ${job.title}
Required Skills: ${(job.requiredSkills || []).join(', ')}
Job Description: ${job.description}

Resume Text:
${resumeText.slice(0, 8000)}

Respond ONLY with valid JSON (no markdown):
{
  "score": <number 0-100>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3"],
  "feedback": "brief 1-2 sentence assessment"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });
    const content = completion.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
  } catch (err) {
    console.error('OpenAI scoring error:', err.message);
    return null;
  }
}

async function scoreWithGemini(resumeText, job) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = `Score resume 0-100 for job "${job.title}". Skills: ${(job.requiredSkills || []).join(', ')}.
Resume: ${resumeText.slice(0, 6000)}
Return JSON only: {"score":number,"matchedSkills":[],"missingSkills":[],"feedback":"string"}`;

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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (err) {
    console.error('Gemini scoring error:', err.message);
    return null;
  }
}

async function scoreResume(resumeText, job) {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  let aiResult = null;

  if (provider === 'gemini') {
    aiResult = await scoreWithGemini(resumeText, job);
  } else {
    aiResult = await scoreWithOpenAI(resumeText, job);
  }

  if (aiResult && typeof aiResult.score === 'number') {
    return {
      score: Math.min(100, Math.max(0, Math.round(aiResult.score))),
      matchedSkills: aiResult.matchedSkills || [],
      missingSkills: aiResult.missingSkills || [],
      feedback: aiResult.feedback || '',
    };
  }

  const fallback = keywordScore(resumeText, job.requiredSkills);
  return {
    score: fallback.score,
    matchedSkills: fallback.matchedSkills,
    missingSkills: fallback.missingSkills,
    feedback: 'Scored using keyword matching (AI unavailable).',
  };
}

module.exports = { scoreResume, keywordScore };
