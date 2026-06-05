/**
 * AI-powered and regex fallback resume text parser.
 */

function extractName(text) {
  const lines = text.split('\n').slice(0, 10);
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$/);
    if (match) return match[1];
  }
  const fallback = text.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
  return fallback ? fallback[1] : '';
}

function extractEmail(text) {
  const match = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  return match ? match[0] : '';
}

function extractSkillsFromText(text, knownSkills = []) {
  const lower = text.toLowerCase();
  return knownSkills.filter((skill) => lower.includes(skill.toLowerCase()));
}

/**
 * Uses Gemini AI to parse candidate information from the full resume text.
 * Falls back to regex-based extraction if credentials are missing or the API fails.
 */
async function parseResumeAI(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('Gemini API key not configured, using regex parsing fallback.');
    return {
      name: extractName(text),
      email: extractEmail(text),
      phone: '',
      location: '',
      skills: [],
      experienceSummary: '',
      educationSummary: '',
    };
  }

  const prompt = `You are an expert resume parsing AI. Extract the candidate's details from this resume text.
  
Resume Text:
${text.slice(0, 6000)}

Respond ONLY with valid JSON:
{
  "name": "Candidate Full Name",
  "email": "candidate@email.com",
  "phone": "Candidate Phone Number",
  "location": "Candidate City, Country",
  "skills": ["skill1", "skill2"],
  "experienceSummary": "brief 1-2 sentence experience history summary",
  "educationSummary": "highest degree and institution info"
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });
    const data = await res.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(resultText.replace(/```json|```/g, '').trim());
    return {
      name: parsed.name || extractName(text),
      email: parsed.email || extractEmail(text),
      phone: parsed.phone || '',
      location: parsed.location || '',
      skills: parsed.skills || [],
      experienceSummary: parsed.experienceSummary || '',
      educationSummary: parsed.educationSummary || '',
    };
  } catch (err) {
    console.error('Gemini resume parsing error, falling back:', err.message);
    return {
      name: extractName(text),
      email: extractEmail(text),
      phone: '',
      location: '',
      skills: [],
      experienceSummary: '',
      educationSummary: '',
    };
  }
}

module.exports = {
  extractName,
  extractEmail,
  extractSkillsFromText,
  parseResumeAI,
};
